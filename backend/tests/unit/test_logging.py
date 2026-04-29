import logging
import pytest
from unittest.mock import patch
from app.core.logging import setup_logging


@pytest.mark.unit
class TestLogging:
    @patch("app.core.logging.settings")
    def test_dev_uses_debug_level(self, mock_settings):
        mock_settings.environment = "development"
        with patch("logging.basicConfig") as mock_basic:
            setup_logging()
            assert mock_basic.call_args.kwargs["level"] == logging.DEBUG

    @patch("app.core.logging.settings")
    def test_prod_uses_info_level(self, mock_settings):
        mock_settings.environment = "production"
        with patch("logging.basicConfig") as mock_basic:
            setup_logging()
            assert mock_basic.call_args.kwargs["level"] == logging.INFO

    @patch("app.core.logging.settings")
    def test_silences_chatty_loggers(self, mock_settings):
        mock_settings.environment = "development"
        with patch("logging.getLogger") as mock_get:
            setup_logging()
            names = [c[0][0] for c in mock_get.call_args_list]
            assert "httpx" in names
            assert "httpcore" in names
            assert "sqlalchemy.engine" in names
            assert "celery" in names