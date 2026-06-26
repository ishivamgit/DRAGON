from app.schemas.auth import LoginRequest, TokenResponse, RefreshRequest
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.schemas.sponsor import SponsorCreate, SponsorUpdate, SponsorResponse
from app.schemas.competition import CompetitionCreate, CompetitionUpdate, CompetitionResponse, CompetitionListResponse
from app.schemas.registration import RegistrationCreate, RegistrationResponse

__all__ = [
    "LoginRequest", "TokenResponse", "RefreshRequest",
    "UserCreate", "UserUpdate", "UserResponse",
    "SponsorCreate", "SponsorUpdate", "SponsorResponse",
    "CompetitionCreate", "CompetitionUpdate", "CompetitionResponse", "CompetitionListResponse",
    "RegistrationCreate", "RegistrationResponse",
]
