from app.core.config import settings


class AIEngine:
    def __init__(self):
        self.provider = settings.AI_PROVIDER
        self.model = settings.AI_MODEL
        self.api_key = settings.AI_API_KEY

    def is_real_ai_enabled(self) -> bool:
        return self.provider != "mock" and bool(self.api_key)

    def get_status(self) -> dict:
        return {
            "engine": "AffiliateAI Pro AI Engine",
            "provider": self.provider,
            "model": self.model,
            "real_ai_enabled": self.is_real_ai_enabled(),
            "mode": "real_ai" if self.is_real_ai_enabled() else "safe_mock",
        }

    def generate_text(
        self,
        system_prompt: str,
        user_prompt: str,
        fallback_text: str,
    ) -> str:
        if not self.is_real_ai_enabled():
            return self._mock_response(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                fallback_text=fallback_text,
            )

        return self._real_ai_placeholder(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            fallback_text=fallback_text,
        )

    def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        fallback_data: dict,
    ) -> dict:
        if not self.is_real_ai_enabled():
            return {
                "provider": self.provider,
                "model": self.model,
                "mode": "safe_mock",
                "data": fallback_data,
            }

        return self._real_json_placeholder(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            fallback_data=fallback_data,
        )

    def _mock_response(
        self,
        system_prompt: str,
        user_prompt: str,
        fallback_text: str,
    ) -> str:
        return (
            f"{fallback_text}\n\n"
            "----\n"
            "AI Engine: modo seguro ativo.\n"
            "Provider: mock.\n"
            "Observação: quando uma IA real for conectada, esta resposta será gerada pelo modelo configurado."
        )

    def _real_ai_placeholder(
        self,
        system_prompt: str,
        user_prompt: str,
        fallback_text: str,
    ) -> str:
        return (
            f"{fallback_text}\n\n"
            "----\n"
            "AI Engine preparado para IA real, mas o conector ainda não foi implementado."
        )

    def _real_json_placeholder(
        self,
        system_prompt: str,
        user_prompt: str,
        fallback_data: dict,
    ) -> dict:
        return {
            "provider": self.provider,
            "model": self.model,
            "mode": "real_ai_placeholder",
            "data": fallback_data,
        }


ai_engine = AIEngine()