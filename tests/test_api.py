import pytest
from datetime import date
import uuid
import sys
from pathlib import Path

# Add backend to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent / "src" / "backend"))

from app.schemas import (
    RegisterRequest,
    LoginRequest,
    CreateWinRequest,
    ReactionType,
    UpsertReactionRequest,
)


def test_register_request_validation():
    # Valid registration
    reg = RegisterRequest(
        username="hoanganh",
        email="hoang@example.com",
        password="ValidPassword123!",
        timezone="Asia/Ho_Chi_Minh",
        display_name="Hoàng Anh"
    )
    assert reg.username == "hoanganh"
    assert reg.email == "hoang@example.com"


def test_create_win_request_validation():
    # Valid 120-char content
    win_req = CreateWinRequest(content="Chạy bộ 3km sáng sớm 🏃")
    assert win_req.content == "Chạy bộ 3km sáng sớm 🏃"

    # Too long content (> 120 chars) should raise ValueError / ValidationError
    with pytest.raises(Exception):
        CreateWinRequest(content="A" * 121)

    # Empty content should raise ValidationError
    with pytest.raises(Exception):
        CreateWinRequest(content="")


def test_reaction_type_validation():
    # Only 3 types allowed: 🔥, 👀, 🤝
    valid_fire = UpsertReactionRequest(type=ReactionType.FIRE)
    assert valid_fire.type == "🔥"

    valid_eyes = UpsertReactionRequest(type=ReactionType.EYES)
    assert valid_eyes.type == "👀"

    valid_handshake = UpsertReactionRequest(type=ReactionType.HANDSHAKE)
    assert valid_handshake.type == "🤝"

    with pytest.raises(ValueError):
        UpsertReactionRequest(type="❤️")  # Heart is not allowed in Anti-Instagram