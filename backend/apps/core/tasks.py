"""
Core Celery tasks with distributed locking.
"""

import logging
from datetime import timedelta
from celery import shared_task
from django.utils import timezone
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings

from .locks import distributed_lock, TaskLockManager

logger = logging.getLogger(__name__)


@shared_task
@distributed_lock("certificate_generation:{user_id}", timeout=120, retry_count=5)
def generate_certificate_task(user_id: int):
    """Generate certificate with distributed lock."""
    from apps.progress.models import Certificate
    from django.contrib.auth.models import User

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found")
        return

    if Certificate.objects.filter(user=user).exists():
        logger.info(f"Certificate already exists for user {user_id}")
        return

    certificate = Certificate.objects.create(
        user=user,
        course_name="Open Source Contribution Course",
        issued_date=timezone.now()
    )

    logger.info(f"Certificate generated for user {user_id}: {certificate.verification_hash}")
    return {"certificate_id": certificate.id, "hash": certificate.verification_hash}


@shared_task
@distributed_lock("daily_digest:{user_id}", timeout=180, retry_count=3)
def send_daily_digest_task(user_id: int):
    """Send daily digest with distributed lock."""
    from django.contrib.auth.models import User
    from apps.progress.models import LessonProgress

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found")
        return

    progress = LessonProgress.objects.filter(
        user=user,
        completed=True,
        updated_at__gte=timezone.now() - timedelta(days=1)
    )

    if not progress.exists():
        logger.info(f"No new progress for user {user_id}")
        return

    context = {
        "user": user,
        "progress": progress,
        "completed_count": progress.count(),
        "date": timezone.now().date(),
    }

    html_content = render_to_string("notifications/daily_digest.html", context)
    plain_content = render_to_string("notifications/daily_digest.txt", context)

    send_mail(
        subject=f"Your Daily Progress Digest - {timezone.now().date()}",
        message=plain_content,
        from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@atelier.dev"),
        recipient_list=[user.email],
        html_message=html_content,
        fail_silently=False,
    )

    logger.info(f"Daily digest sent to user {user_id}")
    return {"user_id": user_id, "completed_count": progress.count()}


@shared_task
@distributed_lock("leaderboard_recalculation", timeout=300, retry_count=3)
def recalculate_leaderboard_task():
    """Recalculate leaderboard with distributed lock."""
    from apps.dashboard.models import Leaderboard
    from apps.progress.models import LessonProgress
    from django.contrib.auth.models import User
    from django.db.models import Sum, Count

    logger.info("Starting leaderboard recalculation")

    user_scores = LessonProgress.objects.values('user').annotate(
        total_score=Sum('score'),
        completed_lessons=Count('id')
    ).order_by('-total_score')

    for user_data in user_scores:
        try:
            user = User.objects.get(id=user_data['user'])
            Leaderboard.objects.update_or_create(
                user=user,
                defaults={
                    'points': user_data['total_score'] or 0,
                    'completed_lessons': user_data['completed_lessons'] or 0,
                    'updated_at': timezone.now(),
                }
            )
        except User.DoesNotExist:
            continue

    top_users = Leaderboard.objects.select_related('user').order_by('-points')[:100]
    logger.info(f"Leaderboard recalculated with {len(top_users)} top users")
    return {"total_users": len(user_scores), "top_users": len(top_users)}


@shared_task
@distributed_lock("badge_evaluation:{user_id}", timeout=60, retry_count=5)
def evaluate_badges_task(user_id: int):
    """Evaluate badges with distributed lock."""
    from apps.progress.badge_evaluator import BadgeEvaluator
    from django.contrib.auth.models import User

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found")
        return

    result = BadgeEvaluator.evaluate(user)
    logger.info(f"Badge evaluation completed for user {user_id}")
    return {"user_id": user_id, "badges_awarded": result.get("badges_awarded", [])}


@shared_task
@distributed_lock("notification_cleanup", timeout=120, retry_count=2)
def cleanup_notifications_task():
    """Clean up old notifications with distributed lock."""
    from apps.notifications.models import Notification

    cutoff = timezone.now() - timezone.timedelta(days=30)
    deleted_count, _ = Notification.objects.filter(
        status=Notification.STATUS_READ,
        created_at__lt=cutoff
    ).delete()

    logger.info(f"Cleaned up {deleted_count} old notifications")
    return {"deleted_count": deleted_count}