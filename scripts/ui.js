// ui.js

// 프로젝트 목록 화면 렌더링
export function renderProjectList(projectNames, onProjectSelect, emptyMessage) {
    const area = document.getElementById("project-list");
    area.innerHTML = "";

    if (!projectNames.length) {
        const empty = document.createElement("div");
        empty.className = "empty-state";
        empty.textContent = emptyMessage || "프로젝트가 없습니다. 새 프로젝트를 추가하세요.";
        area.appendChild(empty);
        return;
    }

    projectNames.forEach(name => {
        const div = document.createElement("div");
        div.className = "project-card";
        div.textContent = name;
        div.title = "프로젝트 열기";

        div.onclick = () => {
            if (typeof onProjectSelect === "function") {
                onProjectSelect(name);
            }
        };

        area.appendChild(div);
    });
}

// 상세 페이지 전환 및 헤더 표시
export function renderProjectDetail(projectName) {
    document.getElementById("page-projects").classList.add("hidden");
    document.getElementById("page-detail").classList.remove("hidden");
    document.getElementById("detail-title").textContent = projectName;
}

// 목록 페이지 전환
export function showProjectListPage() {
    document.getElementById("page-detail").classList.add("hidden");
    document.getElementById("page-projects").classList.remove("hidden");
}

// 파일 카드 렌더링
export function renderFileGrid(files, { onSelect, emptyMessage } = {}) {
    const grid = document.getElementById("file-grid");
    grid.innerHTML = "";

    if (!files.length) {
        const empty = document.createElement("div");
        empty.className = "empty-state";
        empty.textContent = emptyMessage || "파일이 없습니다. 업로드하거나 드래그 앤 드롭하세요.";
        grid.appendChild(empty);
        return;
    }

    files.forEach(file => {
        const previewHtml = createFilePreview(file);
        const card = document.createElement("div");
        card.className = "file-card";
        card.dataset.fileId = file.id;

        card.innerHTML = `
            <div class="file-thumb">
                ${previewHtml}
            </div>
            <div class="file-meta">
                <p class="file-name">${file.name}</p>
                <div class="tag-row">
                    ${(file.tags || []).map(t => `<span class="tag-pill">#${t}</span>`).join("")}
                </div>
            </div>
        `;

        card.onclick = () => {
            if (typeof onSelect === "function") {
                onSelect(file.id);
            }
        };

        grid.appendChild(card);
    });
}

// 전역 검색 결과 렌더링
export function renderGlobalGrid(files, { onSelect, emptyMessage } = {}) {
    const grid = document.getElementById("global-grid");
    grid.innerHTML = "";

    if (!files.length) {
        const empty = document.createElement("div");
        empty.className = "empty-state";
        empty.textContent = emptyMessage || "검색 결과가 없습니다.";
        grid.appendChild(empty);
        return;
    }

    files.forEach(file => {
        const previewHtml = createFilePreview(file);
        const card = document.createElement("div");
        card.className = "file-card global";
        card.dataset.fileId = file.id;

        card.innerHTML = `
            <div class="file-thumb">
                ${previewHtml}
            </div>
            <div class="file-meta">
                <p class="file-name">${file.name}</p>
                <div class="tag-row">
                    ${(file.tags || []).map(t => `<span class="tag-pill">#${t}</span>`).join("")}
                </div>
                <div class="project-badge">📂 ${file.projectName}</div>
            </div>
        `;

        card.onclick = () => {
            if (typeof onSelect === "function") {
                onSelect(file.projectName, file.id);
            }
        };

        grid.appendChild(card);
    });
}

// 드롭존 하이라이트
export function setDropHighlight(enabled) {
    const dz = document.getElementById("drop-zone");
    if (!dz) return;
    dz.classList.toggle("drag-over", enabled);
}

// 모달 표시
export function showFileModal(file, { onRename, onDelete, onAddTag, onRemoveTag, onClose }) {
    const modal = document.getElementById("file-modal");
    const nameInput = document.getElementById("modal-name-input");
    const preview = document.getElementById("modal-image");
    const tagList = document.getElementById("modal-tags");
    const tagForm = document.getElementById("tag-form");
    const tagInput = document.getElementById("tag-input");
    const downloadBtn = document.getElementById("modal-download");
    const closeBtn = document.getElementById("modal-close");

    function escHandler(e) {
        if (e.key === "Escape") {
            handleClose();
        }
    }

    function handleClose() {
        hideFileModal();
        document.removeEventListener("keydown", escHandler);
        if (typeof onClose === "function") onClose();
    }

    nameInput.value = file.name;
    preview.src = file.dataUrl;
    preview.alt = file.name;

    tagList.innerHTML = "";
    (file.tags || []).forEach(tag => {
        const pill = document.createElement("span");
        pill.className = "tag-pill editable";
        pill.textContent = `#${tag}`;

        const removeBtn = document.createElement("button");
        removeBtn.className = "tag-remove";
        removeBtn.textContent = "×";
        removeBtn.title = "태그 제거";
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            if (typeof onRemoveTag === "function") onRemoveTag(tag);
        };

        pill.appendChild(removeBtn);
        tagList.appendChild(pill);
    });

    document.getElementById("modal-save-name").onclick = () => {
        const newName = nameInput.value.trim();
        if (newName && typeof onRename === "function") {
            onRename(newName);
        }
    };

    document.getElementById("modal-delete").onclick = () => {
        if (typeof onDelete === "function") {
            onDelete();
        }
    };

    downloadBtn.onclick = () => {
        if (!file || !file.dataUrl) return;

        const a = document.createElement("a");
        a.href = file.dataUrl;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
    };

    closeBtn.onclick = handleClose;
    modal.onclick = (e) => {
        if (e.target.id === "file-modal") {
            handleClose();
        }
    };

    document.addEventListener("keydown", escHandler);

    tagForm.onsubmit = (e) => {
        e.preventDefault();
        const newTag = tagInput.value.trim();
        if (newTag && typeof onAddTag === "function") {
            onAddTag(newTag);
            tagInput.value = "";
        }
    };

    modal.classList.remove("hidden");
}

export function hideFileModal() {
    const modal = document.getElementById("file-modal");
    modal.classList.add("hidden");
}

// 구독 모달 초기화
export function initSubscriptionModal() {
    const openBtn = document.getElementById("subscribe-open-btn");
    const modal = document.getElementById("subscribe-modal");
    const closeBtn = document.getElementById("subscribe-close");
    const payBtn = document.getElementById("fake-pay-btn");

    if (!openBtn || !modal || !closeBtn || !payBtn) return;

    const handleClose = () => hideSubscriptionModal();

    openBtn.onclick = showSubscriptionModal;
    closeBtn.onclick = handleClose;
    modal.addEventListener("click", (e) => {
        if (e.target === modal) handleClose();
    });
    payBtn.onclick = () => {
        alert("결제는 제공되지 않습니다");
    };

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !modal.classList.contains("hidden")) {
            handleClose();
        }
    });
}

export function showSubscriptionModal() {
    const modal = document.getElementById("subscribe-modal");
    if (!modal) return;
    modal.classList.remove("hidden");
}

export function hideSubscriptionModal() {
    const modal = document.getElementById("subscribe-modal");
    if (!modal) return;
    modal.classList.add("hidden");
}

const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "bmp"];
function createFilePreview(file) {
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (imageExts.includes(ext)) {
        return `<img src="${file.dataUrl}" alt="${file.name}" class="file-thumb-img">`;
    }
    return `<div class="file-thumb-ext">${ext || "file"}</div>`;
}
