class NotEnoughQuestionsException(Exception):
    def __init__(
        self,
        requested: int,
        available: int,
    ):
        super().__init__(
            f"Only {available} questions available, but {requested} requested."
        )