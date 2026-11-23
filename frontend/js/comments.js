// ProjectFlow Task Comments & Discussion Controller

function renderCommentsList(comments) {
  const container = document.getElementById('tdCommentsList');
  if (!container) return;

  if (!comments || comments.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); font-size: 13px; padding: 24px 0;">
        No comments yet. Start the conversation!
      </div>
    `;
    return;
  }

  const currentUserId = STATE.getUser()?._id;

  container.innerHTML = comments
    .map((c) => {
      const u = c.user || {};
      const isAuthor = u._id === currentUserId || u === currentUserId;

      return `
        <div class="comment-card" id="comment-${c._id}">
          <img class="comment-avatar" src="${UI.getAvatar(u)}" alt="User">
          <div class="comment-body">
            <div class="comment-header">
              <span class="comment-author">${UI.escapeHTML(u.name || 'Member')}</span>
              <span class="comment-time">${UI.timeAgo(c.createdAt)}</span>
            </div>
            <div class="comment-text" id="comment-content-${c._id}">${UI.escapeHTML(c.content)}</div>
            ${
              isAuthor
                ? `
                <div class="comment-actions">
                  <button class="btn-comment-action" onclick="editCommentPrompt('${c._id}')">Edit</button>
                  <span>&bull;</span>
                  <button class="btn-comment-action delete" onclick="deleteComment('${c._id}')">Delete</button>
                </div>
              `
                : ''
            }
          </div>
        </div>
      `;
    })
    .join('');

  // Scroll to bottom of comments
  container.scrollTop = container.scrollHeight;
}

function appendCommentToModal(comment) {
  const container = document.getElementById('tdCommentsList');
  if (!container) return;

  // If container had empty placeholder, clear it
  if (container.querySelector('.comment-card') === null) {
    container.innerHTML = '';
  }

  const currentUserId = STATE.getUser()?._id;
  const u = comment.user || {};
  const isAuthor = u._id === currentUserId || u === currentUserId;

  const card = document.createElement('div');
  card.className = 'comment-card';
  card.id = `comment-${comment._id}`;
  card.style.animation = 'fadeIn 0.3s ease';

  card.innerHTML = `
    <img class="comment-avatar" src="${UI.getAvatar(u)}" alt="User">
    <div class="comment-body">
      <div class="comment-header">
        <span class="comment-author">${UI.escapeHTML(u.name || 'Member')}</span>
        <span class="comment-time">just now</span>
      </div>
      <div class="comment-text" id="comment-content-${comment._id}">${UI.escapeHTML(comment.content)}</div>
      ${
        isAuthor
          ? `
          <div class="comment-actions">
            <button class="btn-comment-action" onclick="editCommentPrompt('${comment._id}')">Edit</button>
            <span>&bull;</span>
            <button class="btn-comment-action delete" onclick="deleteComment('${comment._id}')">Delete</button>
          </div>
        `
          : ''
      }
    </div>
  `;

  container.appendChild(card);
  container.scrollTop = container.scrollHeight;
}

async function handleAddCommentSubmit(event) {
  event.preventDefault();
  const input = document.getElementById('newCommentContent');
  const content = (input.value || '').trim();

  if (!content || !STATE.activeTask) return;

  try {
    const res = await API.post(`/tasks/${STATE.activeTask._id}/comments`, { content });
    input.value = '';

    if (!STATE.activeTask.comments) STATE.activeTask.comments = [];
    STATE.activeTask.comments.push(res.comment);
    STATE.activeTask.commentCount = (STATE.activeTask.commentCount || 0) + 1;

    // Update count in modal
    const countEl = document.getElementById('tdCommentCount');
    if (countEl) countEl.textContent = STATE.activeTask.commentCount;

    appendCommentToModal(res.comment);
    if (typeof loadTaskActivities === 'function' && STATE.activeTask) {
      loadTaskActivities(STATE.activeTask._id);
    }

    // Update count on card
    const task = STATE.currentTasks.find((t) => t._id === STATE.activeTask._id);
    if (task) {
      task.commentCount = (task.commentCount || 0) + 1;
      renderKanbanCards();
    }
  } catch (error) {
    UI.showToast(error.message, 'error', 'Comment Failed');
  }
}

async function editCommentPrompt(commentId) {
  const contentEl = document.getElementById(`comment-content-${commentId}`);
  if (!contentEl) return;

  const currentText = contentEl.textContent;
  const newText = prompt('Edit your comment:', currentText);

  if (newText !== null && newText.trim() && newText.trim() !== currentText) {
    try {
      const res = await API.put(`/comments/${commentId}`, { content: newText.trim() });
      contentEl.textContent = res.comment.content;
      UI.showToast('Comment updated', 'success');
    } catch (error) {
      UI.showToast(error.message, 'error');
    }
  }
}

async function deleteComment(commentId) {
  if (!confirm('Are you sure you want to delete this comment?')) return;

  try {
    await API.delete(`/comments/${commentId}`);
    const el = document.getElementById(`comment-${commentId}`);
    if (el) el.remove();

    if (STATE.activeTask) {
      if (STATE.activeTask.comments) {
        STATE.activeTask.comments = STATE.activeTask.comments.filter((c) => c._id !== commentId);
      }
      STATE.activeTask.commentCount = Math.max(0, (STATE.activeTask.commentCount || 1) - 1);
      const countEl = document.getElementById('tdCommentCount');
      if (countEl) countEl.textContent = STATE.activeTask.commentCount;

      const task = STATE.currentTasks.find((t) => t._id === STATE.activeTask._id);
      if (task && task.commentCount > 0) {
        task.commentCount--;
        renderKanbanCards();
      }
    }

    UI.showToast('Comment deleted', 'info');
  } catch (error) {
    UI.showToast(error.message, 'error');
  }
}

window.renderCommentsList = renderCommentsList;
window.appendCommentToModal = appendCommentToModal;
window.handleAddCommentSubmit = handleAddCommentSubmit;
window.editCommentPrompt = editCommentPrompt;
window.deleteComment = deleteComment;
