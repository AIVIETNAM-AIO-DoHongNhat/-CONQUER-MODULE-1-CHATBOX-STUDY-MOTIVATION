from django.urls import path
from session.views import StartSessionView, EndSessionView

urlpatterns = [
    path("start/", StartSessionView.as_view(), name="session-start"),
    path("end/", EndSessionView.as_view(), name="session-end"),
]
