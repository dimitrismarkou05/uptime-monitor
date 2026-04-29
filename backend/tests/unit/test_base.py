import pytest
from sqlalchemy.orm import DeclarativeBase
from app.db.base import Base


@pytest.mark.unit
class TestBase:
    def test_base_is_declarative(self):
        assert issubclass(Base, DeclarativeBase)