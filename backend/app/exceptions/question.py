class QuestionNotFoundException(Exception):
    def __init__(self):
        super().__init__("Question not found.")