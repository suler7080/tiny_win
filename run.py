"""
Tiny Win Crew — Smart Auto-Checkpoint Runner
Tự động phát hiện các giai đoạn đã hoàn thành và điều phối các task Giai đoạn 3, 4, 5.
"""
import os
import sys
from pathlib import Path

# Fix Windows console UTF-8 output encoding
os.environ["PYTHONIOENCODING"] = "utf-8"
os.environ["CREWAI_TRACING_ENABLED"] = "false"
os.environ["CREWAI_TELEMETRY_OPT_OUT"] = "true"

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from dotenv import load_dotenv
import litellm
from crewai import LLM
from crewai.project.crew_loader import load_crew

load_dotenv()
litellm.drop_params = True

def get_completed_checkpoints():
    checkpoints = {
        "phase1_architecture": (Path("docs/schema.sql").exists() and Path("docs/openapi.yaml").exists()),
        "phase2_backend": (Path("src/backend").exists() and any(Path("src/backend").iterdir())),
        "phase2_mobile": (Path("src/mobile").exists() and any(Path("src/mobile").iterdir())),
        "phase3_advanced": (Path("docs/phase3_advanced_spec.md").exists()),
        "phase3_backend_notes": (Path("docs/phase3_backend_notes.md").exists()),
        "phase3_mobile_widgets": (Path("docs/phase3_mobile_widgets.md").exists()),
        "phase4_qa_e2e": (Path("docs/closed_beta_checklist.md").exists()),
        "phase5_release": (Path("docs/aso_release_pack.md").exists()),
    }
    return checkpoints

def main():
    checkpoints = get_completed_checkpoints()
    print("=" * 65)
    print(">>> TINY WIN CREW - SMART AUTO CHECKPOINT (PHASES 1 -> 5)")
    print("=" * 65)
    print(f"[{'X' if checkpoints['phase1_architecture'] else ' '}] Phase 1: Architecture & Design (docs/schema.sql, openapi.yaml)")
    print(f"[{'X' if checkpoints['phase2_backend'] else ' '}] Phase 2: Core Backend (src/backend/)")
    print(f"[{'X' if checkpoints['phase2_mobile'] else ' '}] Phase 2: Core Mobile Client (src/mobile/)")
    print(f"[{'X' if checkpoints['phase3_advanced'] else ' '}] Phase 3: Advanced Spec (docs/phase3_advanced_spec.md)")
    print(f"[{'X' if checkpoints['phase3_backend_notes'] else ' '}] Phase 3: Backend Services (docs/phase3_backend_notes.md)")
    print(f"[{'X' if checkpoints['phase3_mobile_widgets'] else ' '}] Phase 3: Mobile Widgets (docs/phase3_mobile_widgets.md)")
    print(f"[{'X' if checkpoints['phase4_qa_e2e'] else ' '}] Phase 4: QA E2E & Closed Beta (docs/closed_beta_checklist.md)")
    print(f"[{'X' if checkpoints['phase5_release'] else ' '}] Phase 5: Release & ASO Pack (docs/aso_release_pack.md)")
    print("=" * 65)

    crew, _ = load_crew(Path("crew.jsonc"))

    # Explicitly configure EcoAPI endpoint for all loaded agents
    api_key = os.getenv("OPENAI_API_KEY", "sk-1be117b6df0254a5-6sjbgf-fbd7db5c")
    base_url = os.getenv("OPENAI_BASE_URL", "https://ecoapi.net/v1")
    eco_llm = LLM(
        model="openai/gpt-5-4",
        base_url=base_url,
        api_key=api_key
    )

    for agent in crew.agents:
        agent.llm = eco_llm

    pending_tasks = []
    for task in crew.tasks:
        if task.agent:
            task.agent.llm = eco_llm

        if task.name == "task_phase3_advanced_spec" and checkpoints["phase3_advanced"]:
            print(f">> Skip '{task.name}' (Already in docs/phase3_advanced_spec.md)")
            continue
        if task.name == "task_phase3_backend_services" and checkpoints["phase3_backend_notes"]:
            print(f">> Skip '{task.name}' (Already in docs/phase3_backend_notes.md)")
            continue
        if task.name == "task_phase3_mobile_widgets_and_features" and checkpoints["phase3_mobile_widgets"]:
            print(f">> Skip '{task.name}' (Already in docs/phase3_mobile_widgets.md)")
            continue
        if task.name == "task_phase4_qa_e2e_and_security" and checkpoints["phase4_qa_e2e"]:
            print(f">> Skip '{task.name}' (Already in docs/closed_beta_checklist.md)")
            continue
        if task.name == "task_phase5_release_and_aso" and checkpoints["phase5_release"]:
            print(f">> Skip '{task.name}' (Already in docs/aso_release_pack.md)")
            continue
        pending_tasks.append(task)

    if not pending_tasks:
        print("\n[OK] All tasks in Phases 1 through 5 are already 100% completed!")
        return

    crew.tasks = pending_tasks
    print(f"\n>> Starting execution for {len(pending_tasks)} pending tasks via EcoAPI ({base_url})...")
    result = crew.kickoff()
    print("\n[OK] Completed all tasks successfully!")
    print(result)

if __name__ == "__main__":
    main()
