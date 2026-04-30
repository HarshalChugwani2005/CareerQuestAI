from enum import Enum

class UserRole(str, Enum):
    LENDER = "lender"
    STUDENT = "student"

class LoanStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    DELINQUENT = "delinquent"
    PAID = "paid"
    DEFAULTED = "defaulted"

class MilestoneType(str, Enum):
    CERTIFICATION = "certification"
    APPLICATIONS_STREAK = "applications_streak"
    MOCK_INTERVIEW = "mock_interview"
    OFFER_RECEIVED = "offer_received"
    CLOUD_CERTIFICATION = "cloud_certification"
    TECHNICAL_SKILL = "technical_skill"
    COMMUNICATION_SKILL = "communication_skill"

class JobApplicationStatus(str, Enum):
    APPLIED = "applied"
    INTERVIEW = "interview"
    OFFER = "offer"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"

class DecisionType(str, Enum):
    APPROVE = "approve"
    REVIEW = "review"
    DECLINE = "decline"

