class ExamNotFoundException(Exception):
    def __init__(self):
        super().__init__("Exam not found.")