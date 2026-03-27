from celery import Celery

from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "igcreator",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "refresh-tokens-daily": {
            "task": "app.tasks.token_refresh.refresh_expiring_tokens",
            "schedule": 86400.0,  # once per day
        },
        "collect-analytics-daily": {
            "task": "app.tasks.analytics.collect_all_analytics",
            "schedule": 86400.0,  # once per day
        },
        "process-posting-queue": {
            "task": "app.tasks.posting.process_scheduled_posts",
            "schedule": 60.0,  # every minute
        },
        "refresh-strategy-trends": {
            "task": "app.tasks.strategy.refresh_all_trends",
            "schedule": 259200.0,  # every 3 days
        },
    },
)

# Auto-discover tasks in app.tasks package
celery_app.autodiscover_tasks(["app.tasks"])
