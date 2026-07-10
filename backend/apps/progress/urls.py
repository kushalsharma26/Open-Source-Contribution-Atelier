from django.urls import path

from .views import (
    BadgeListView,
    BulkProgressUpdateView,
    BulkSyncProgressView,
    CertificateVerificationView,
    CodeSubmissionView,
    CommunityFeedView,
    CommunityStatsView,
    ContributorTimelineView,
    ExportNotesView,  # ✅ ADDED
    HelpRequestListCreateView,
    LessonBookmarkView,
    MentorHelpRequestListView,
    MyCertificateView,
    MyProgressView,
    PeerReviewView,
    QuizAttemptView,
    RecommendationsView,
)

urlpatterns = [
    # Badges
    path("badges/", BadgeListView.as_view(), name="badges"),
    
    # Progress
    path("me/", MyProgressView.as_view(), name="my-progress"),
    path("bulk-sync/", BulkSyncProgressView.as_view(), name="bulk-sync"),
    path("bulk-update/", BulkProgressUpdateView.as_view(), name="bulk-update"),
    
    # Recommendations
    path("recommendations/", RecommendationsView.as_view(), name="recommendations"),
    
    # Community
    path("feed/", CommunityFeedView.as_view(), name="community-feed"),
    path("community-stats/", CommunityStatsView.as_view(), name="community-stats"),
    
    # Help Requests
    path("help-requests/", HelpRequestListCreateView.as_view(), name="help-requests"),
    path(
        "mentor/help-requests/",
        MentorHelpRequestListView.as_view(),
        name="mentor-help-requests",
    ),
    
    # Timeline
    path("timeline/", ContributorTimelineView.as_view(), name="contributor-timeline"),
    path(
        "contributor-timeline/",
        ContributorTimelineView.as_view(),
        name="contributor-timeline-alias",
    ),
    
    # Quizzes
    path("quiz-attempts/", QuizAttemptView.as_view(), name="quiz-attempts"),
    
    # Certificates
    path("certificate/", MyCertificateView.as_view(), name="my-certificate"),
    path(
        "verify/<str:hash>/",
        CertificateVerificationView.as_view(),
        name="verify-certificate",
    ),
    
    # Bookmarks
    path("bookmarks/", LessonBookmarkView.as_view(), name="lesson-bookmarks"),
    path("bookmarks/<str:slug>/", LessonBookmarkView.as_view(), name="lesson-bookmark-detail"),
    
    # Code Submissions & Reviews
    path("code-submissions/", CodeSubmissionView.as_view(), name="code-submissions"),
    path(
        "code-submissions/<int:submission_id>/reviews/",
        PeerReviewView.as_view(),
        name="peer-reviews",
    ),
    
    # ✅ ADDED: Notes Export
    path("notes/export/", ExportNotesView.as_view(), name="notes-export"),
]