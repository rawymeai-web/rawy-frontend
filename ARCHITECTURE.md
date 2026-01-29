# Architecture & Workflow SOP

> [!IMPORTANT]
> This document is the Source of Truth for the application's architecture. any changes to the core workflow or state management MUST be reflected here.

## 1. Core Architecture Principles

The application state is divided into two primary domains, handled by React Contexts:

### A. Story Domain (`StoryContext`)
**Responsibility**: Manages the "Data" of the story being created, and the high-level UI navigation state.
- **State**: `StoryData` (User inputs, characters, generated content).
- **UI State**: `screen` (Navigation), `isPaymentModalOpen`, `isOrderStatusModalOpen`.
- **Persistence**: Should ideally persist to local storage (future improvement).
- **Key Actions**: `updateStory`, `setMainCharacter`, `setTheme`, `setScreen`.
- **Constraint**: This context is *passive*. It stores data but does not trigger side effects or API calls.

### B. Workflow Domain (`WorkflowContext`)
**Responsibility**: Manages the "Process" of creation.
- **State**: `stage` (1-6), `isLoading`, `currentArtifact` (the distinct JSON output of the current stage), `lastError`.
- **Key Actions**: `nextStage`, `prevStage`, `retryStage`.
- **Constraint**: This context is *active*. It triggers the `geminiService` calls via the `useStoryWorkflow` hook.

## 2. The 6-Stage AI Workflow

The workflow is a linear state machine. Each stage depends on the data from the previous ones.

| Stage | Name | Input | Output | Action |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Junior Writer** | User Inputs + Theme | `StoryBlueprint` | Generates the structural plan. |
| **2** | **Senior Writer** | `StoryBlueprint` | `StoryBlueprint` (Refined) | Validates narrative arc and logic. |
| **3** | **Visual Designer** | `StoryBlueprint` | `SpreadDesignPlan` | Plans visual composition for spreads. |
| **4** | **Creative Director** | `SpreadDesignPlan` | `SpreadDesignPlan` (Refined) | Refines visual cohesion. |
| **5** | **Prompt Engineer** | `SpreadDesignPlan` + Style | `finalPrompts` (Array) | Converts visual plan to text prompts. |
| **6** | **Prompt Reviewer** | `finalPrompts` | `finalPrompts` (Refined) | QA on prompts. |

### Transitions
- **`runCurrentStage`**: Triggered automatically or manually when entering a stage.
- **Artifacts**: The result of each stage (`workflowArtifact`) is displayed to the user for approval.
- **Approval**: When the user clicks "Next/Approve", the artifact is merged into `StoryContext` and the stage increments.

## 3. Directory Structure Standards

- **`/context`**: React Context definitions and Providers.
- **`/hooks`**: Custom hooks (e.g., `useStoryWorkflow`).
- **`/services`**: Stateless API wrappers.
- **`/components`**: Pure UI components. Should consume Contexts, not receive deep prop drilling.
