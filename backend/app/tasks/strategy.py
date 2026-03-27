"""Celery tasks for strategy research and trend monitoring."""

import logging

from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3)
def full_research_pipeline(self, profile_id: str):
    """Run complete research: competitors + trends + insights.

    In production this chains scraping tasks and AI analysis.
    """
    logger.info("Starting full research pipeline for profile %s", profile_id)
    try:
        # Step 1: Scrape competitor profiles
        research_competitors.delay(profile_id)
        # Step 2: Scrape niche trends
        scrape_niche_trends.delay(profile_id)
        logger.info("Research pipeline dispatched for profile %s", profile_id)
    except Exception as exc:
        logger.error("Research pipeline failed for %s: %s", profile_id, exc)
        self.retry(exc=exc, countdown=60)


@celery_app.task
def research_competitors(profile_id: str):
    """Scrape and analyze competitor accounts for a business profile.

    In production:
    1. Load profile from DB to get competitor handles
    2. Call instagram_scraper.scrape_competitor_profile() for each
    3. Call strategy_ai.analyze_competitors() with scraped data
    4. Save CompetitorAccount records and StrategyInsight records to DB
    """
    logger.info("Researching competitors for profile %s", profile_id)


@celery_app.task
def scrape_niche_trends(profile_id: str):
    """Scrape trending content in the profile's niche.

    In production:
    1. Load profile to determine niche/industry
    2. Call instagram_scraper.scrape_niche_explore()
    3. Call instagram_scraper.scrape_trending_audio()
    4. Call strategy_ai.analyze_trends()
    5. Save TrendSnapshot records to DB
    """
    logger.info("Scraping niche trends for profile %s", profile_id)


@celery_app.task
def refresh_all_trends():
    """Periodic task: refresh trends for all active strategies.

    Runs every 3 days via Celery beat schedule.
    In production:
    1. Query all ContentStrategy records with status='active'
    2. For each, dispatch scrape_niche_trends()
    3. Dispatch generate_trend_content_suggestions() after scraping completes
    """
    logger.info("Refreshing trends for all active strategies")


@celery_app.task
def generate_trend_content_suggestions(strategy_id: str):
    """Generate trend-based content suggestions for a strategy.

    In production:
    1. Load latest TrendSnapshot for the strategy's profile
    2. Load current ContentInventory
    3. Call strategy_ai.suggest_trending_content()
    4. Return suggestions (or save to DB for frontend polling)
    """
    logger.info("Generating trend content suggestions for strategy %s", strategy_id)


@celery_app.task
def assess_milestone_performance(strategy_id: str, milestone_index: int):
    """Assess performance against a strategy milestone.

    In production:
    1. Load ContentStrategy and current Instagram metrics
    2. Call strategy_ai.assess_milestone_performance()
    3. Append performance review to strategy.performance_reviews
    4. Update milestone status
    """
    logger.info("Assessing milestone %d for strategy %s", milestone_index, strategy_id)
