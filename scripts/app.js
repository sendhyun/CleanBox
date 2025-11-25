// app.js

import { createProject, getProjectNames, renameProject, deleteProject } from "./project.js";
import {
    addFiles,
    deleteFile,
    renameFile,
    addTag,
    removeTag,
    getFileById,
    getFilteredSortedFiles,
    getGlobalSearchResults
} from "./files.js";
import {
    renderProjectList,
    renderProjectDetail,
    renderFileGrid,
    renderGlobalGrid,
    showProjectListPage,
    showFileModal,
    hideFileModal,
    setDropHighlight
} from "./ui.js";

let currentProject = null;
let currentSort = "createdAt";
let currentSearch = "";
let globalSearchTerm = "";
let globalSort = "createdAt";
let isGlobalSearch = false;
const THEME_KEY = "cleanbox-theme";

document.addEventListener("DOMContentLoaded", () => {
    bindGlobalEvents();
    refreshProjectList();
    syncGlobalSearchInput();
    initThemeToggle();
});

function bindGlobalEvents() {
    document.getElementById("add-project-btn").onclick = handleCreateProject;
    document.getElementById("back-btn").onclick = handleBackToProjects;
    document.getElementById("upload-btn").onclick = () => document.getElementById("file-input").click();
    document.getElementById("rename-project-btn").onclick = handleRenameProject;
    document.getElementById("delete-project-btn").onclick = handleDeleteProject;
    document.getElementById("file-input").onchange = (e) => {
        handleFiles(e.target.files);
        e.target.value = "";
    };
    document.getElementById("file-search").oninput = (e) => {
        handleLocalSearchInput(e.target.value);
    };
    document.getElementById("sort-select").onchange = (e) => {
        currentSort = e.target.value;
        if (!isGlobalSearch) refreshFiles();
    };
    document.querySelector(".global-search").oninput = (e) => {
        handleGlobalSearchInput(e.target.value);
    };
    document.getElementById("global-sort-select").onchange = (e) => {
        globalSort = e.target.value;
        if (isGlobalSearch) renderGlobalResults();
    };
    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
        themeToggle.onchange = (e) => {
            const mode = e.target.checked ? "dark" : "light";
            applyTheme(mode);
        };
    }

    const dropZone = document.getElementById("drop-zone");
    dropZone.onclick = () => document.getElementById("file-input").click();

    const stop = (e) => { e.preventDefault(); e.stopPropagation(); };

    ["dragenter", "dragover"].forEach(ev => {
        dropZone.addEventListener(ev, (e) => {
            stop(e);
            setDropHighlight(true);
        });
    });
    dropZone.addEventListener("dragleave", (e) => {
        stop(e);
        setDropHighlight(false);
    });
    dropZone.addEventListener("drop", async (e) => {
        stop(e);
        setDropHighlight(false);
        const files = e.dataTransfer?.files;
        if (files?.length) {
            await handleFiles(files);
        }
    });
}

function handleCreateProject() {
    const name = prompt("프로젝트 이름을 입력하세요:");
    if (createProject(name)) {
        refreshProjectList();
    }
}

function handleRenameProject() {
    if (!currentProject) {
        alert("프로젝트를 먼저 선택하세요.");
        return;
    }
    const newName = prompt("새 프로젝트 이름을 입력하세요:", currentProject);
    if (newName === null) return; // cancelled
    const trimmed = (newName || "").trim();
    if (!trimmed) {
        alert("프로젝트 이름을 입력하세요.");
        return;
    }
    if (trimmed === currentProject) return;

    const success = renameProject(currentProject, trimmed);
    if (!success) return;

    currentProject = trimmed;
    renderProjectDetail(currentProject);
    syncDetailInputs();
    refreshProjectList();
    refreshFiles();
}

function handleDeleteProject() {
    if (!currentProject) return;
    const confirmed = confirm("이 프로젝트를 삭제할까요? 프로젝트 내 모든 파일이 삭제됩니다.");
    if (!confirmed) return;

    const success = deleteProject(currentProject);
    if (!success) return;

    currentProject = null;
    hideFileModal();
    showProjectListPage();
    refreshProjectList();
}

function setCurrentProject(name) {
    currentProject = name;
    exitGlobalSearchMode(false);
    renderProjectDetail(name);
    syncDetailInputs();
    refreshFiles();
}

function syncDetailInputs() {
    document.getElementById("file-search").value = currentSearch;
    document.getElementById("sort-select").value = currentSort;
    syncGlobalSearchInput();
}

function handleBackToProjects() {
    currentProject = null;
    hideFileModal();
    showProjectListPage();
    refreshProjectList();
    syncGlobalSearchInput();
}

async function handleFiles(fileList) {
    if (!currentProject) {
        alert("프로젝트를 먼저 선택하세요.");
        return;
    }
    if (!fileList?.length) return;
    await addFiles(currentProject, fileList);
    refreshFiles();
}

function refreshProjectList() {
    const names = getProjectNames();
    const emptyMessage = "프로젝트가 없습니다. 새 프로젝트를 추가하세요.";
    renderProjectList(names, setCurrentProject, emptyMessage);
}

function refreshFiles() {
    if (!currentProject) return;
    const files = getFilteredSortedFiles(currentProject, currentSearch, currentSort);
    const emptyMessage = currentSearch
        ? "검색/필터 결과가 없습니다. 검색어나 태그를 확인하세요."
        : "파일이 없습니다. 업로드하거나 드래그 앤 드롭하세요.";
    renderFileGrid(files, { onSelect: (fileId) => renderModalForFile(currentProject, fileId), emptyMessage });
}

function syncAfterFileChange(fileId) {
    if (isGlobalSearch) {
        renderGlobalResults();
        const updated = fileId ? getFileById(activeModalProject || currentProject, fileId) : null;
        if (updated && activeModalProject) {
            showFileModal(updated, fileModalCallbacks(activeModalProject, fileId));
        } else {
            hideFileModal();
        }
    } else {
        refreshFiles();
        const updated = fileId ? getFileById(currentProject, fileId) : null;
        if (updated) {
            showFileModal(updated, fileModalCallbacks(currentProject, fileId));
        } else {
            hideFileModal();
        }
    }
}

let activeModalProject = null;

function fileModalCallbacks(projectName, fileId) {
    return {
        onRename: (newName) => {
            renameFile(projectName, fileId, newName);
            activeModalProject = projectName;
            syncAfterFileChange(fileId);
        },
        onDelete: () => {
            if (confirm("이 파일을 삭제할까요?")) {
                deleteFile(projectName, fileId);
                activeModalProject = projectName;
                syncAfterFileChange(null);
            }
        },
        onAddTag: (tag) => {
            addTag(projectName, fileId, tag);
            activeModalProject = projectName;
            syncAfterFileChange(fileId);
        },
        onRemoveTag: (tag) => {
            removeTag(projectName, fileId, tag);
            activeModalProject = projectName;
            syncAfterFileChange(fileId);
        },
        onClose: () => {}
    };
}

function renderModalForFile(projectName, fileId) {
    activeModalProject = projectName;
    const file = getFileById(projectName, fileId);
    if (!file) {
        hideFileModal();
        return;
    }
    showFileModal(file, fileModalCallbacks(projectName, fileId));
}

function syncGlobalSearchInput() {
    const input = document.querySelector(".global-search");
    if (input) input.value = globalSearchTerm;
}

function handleLocalSearchInput(value) {
    currentSearch = value;
    syncDetailInputs();
    if (!isGlobalSearch && currentProject) {
        refreshFiles();
    }
}

function handleGlobalSearchInput(value) {
    globalSearchTerm = value;
    if (!globalSearchTerm.trim()) {
        exitGlobalSearchMode(true);
        return;
    }
    isGlobalSearch = true;
    syncGlobalInputs();
    renderGlobalResults();
}

function syncGlobalInputs() {
    syncGlobalSearchInput();
    const select = document.getElementById("global-sort-select");
    if (select) select.value = globalSort;
}

function exitGlobalSearchMode(restoreView) {
    isGlobalSearch = false;
    globalSearchTerm = "";
    syncGlobalInputs();
    document.getElementById("page-global").classList.add("hidden");
    if (restoreView) {
        if (currentProject) {
            renderProjectDetail(currentProject);
            refreshFiles();
            syncDetailInputs();
        } else {
            showProjectListPage();
            refreshProjectList();
        }
    }
}

function renderGlobalResults() {
    const results = getGlobalSearchResults(globalSearchTerm, globalSort);
    document.getElementById("page-projects").classList.add("hidden");
    document.getElementById("page-detail").classList.add("hidden");
    document.getElementById("page-global").classList.remove("hidden");
    const emptyMessage = "검색 결과가 없습니다.";
    renderGlobalGrid(results, { onSelect: renderModalForFile, emptyMessage });
}

function initThemeToggle() {
    const saved = loadTheme();
    applyTheme(saved);
}

function loadTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark" || saved === "light") return saved;
    return "light";
}

function applyTheme(mode) {
    const isDark = mode === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    const toggle = document.getElementById("theme-toggle");
    if (toggle) toggle.checked = isDark;
    localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
}
