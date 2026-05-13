import { useEffect, useState } from "react";
import type { Project } from "../../../types";

export function useProjectSelection(projects: Project[]) {
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [pendingSelectedProjectId, setPendingSelectedProjectId] = useState("");

  useEffect(() => {
    const selectedProjectExists = projects.some((project) => project.id === selectedProjectId);

    if (
      pendingSelectedProjectId &&
      selectedProjectId === pendingSelectedProjectId &&
      !selectedProjectExists
    ) {
      return;
    }

    if (
      pendingSelectedProjectId &&
      (selectedProjectExists || selectedProjectId !== pendingSelectedProjectId)
    ) {
      setPendingSelectedProjectId("");
    }

    const nextProjectId = selectedProjectExists ? selectedProjectId : (projects[0]?.id ?? "");

    if (selectedProjectId !== nextProjectId) {
      setSelectedProjectId(nextProjectId);
    }
  }, [pendingSelectedProjectId, projects, selectedProjectId]);

  function selectCreatedProject(project: Project) {
    setPendingSelectedProjectId(project.id);
    setSelectedProjectId(project.id);
  }

  return {
    currentProject: projects.find((project) => project.id === selectedProjectId),
    selectCreatedProject,
    selectProjectId: setSelectedProjectId,
    selectedProjectId,
  };
}
