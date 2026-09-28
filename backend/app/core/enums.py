from enum import Enum


class UserRole(str, Enum):
    STUDENT = "STUDENT"
    EXAMINER = "EXAMINER"
    ADMIN = "ADMIN"


class QuestionType(str, Enum):
    MCQ = "MCQ"
    MULTI_SELECT = "MULTI_SELECT"
    TRUE_FALSE = "TRUE_FALSE"
    SHORT_ANSWER = "SHORT_ANSWER"
    LONG_ANSWER = "LONG_ANSWER"
    IMAGE_UPLOAD = "IMAGE_UPLOAD"


class DifficultyLevel(str, Enum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"


class ExamStatus(str, Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    COMPLETED = "COMPLETED"


class SessionStatus(str, Enum):
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    SUBMITTED = "SUBMITTED"
    TIME_UP = "TIME_UP"
    CANCELLED = "CANCELLED"


class ResultStatus(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"


class ProctorEventType(str, Enum):
    FACE_MISSING = "FACE_MISSING"
    MULTIPLE_FACES = "MULTIPLE_FACES"
    GAZE_AWAY = "GAZE_AWAY"
    TAB_SWITCH = "TAB_SWITCH"
    WINDOW_BLUR = "WINDOW_BLUR"
    COPY_PASTE = "COPY_PASTE"
    RIGHT_CLICK = "RIGHT_CLICK"
    FULLSCREEN_EXIT = "FULLSCREEN_EXIT"