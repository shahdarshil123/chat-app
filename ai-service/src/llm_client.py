from abc import ABC, abstractmethod
from typing import List

class BaseLLM(ABC):
    @abstractmethod
    async def complete(self, prompt: str) -> List[str]:
        """
        Sends a prompt to the LLM and returns a list of completion strings.
        Usually returns just one option: ["completion text"]
        """
        pass