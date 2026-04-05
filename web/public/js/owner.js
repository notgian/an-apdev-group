// OWNER EXCLUSIVE STUFF
/* Review Reply Exclusive Stuff */

// const respInps = document.getElementsByClassName('response-comment-input')
// for (let textarea of respInps) {
//     textarea.addEventListener('input', function() {
//       this.style.height = 'auto';
//       this.style.height = (this.scrollHeight) + 'px';
//     });
// }

const adjustResponseInput = (el) => {
    el.style.height = 'auto';
    el.style.height = (this.scrollHeight) + 'px';
}

// Show Reply Editor 
// const showReplies = document.getElementsByClassName('review-reply')
// for (let rply of showReplies) {
//     rply.addEventListener('click', (e) => {
//         // yes this is scuffed, no I will not fix this
//         const review = e.target.parentElement.parentElement.parentElement;
//
//         const responseBody = review.getElementsByClassName('review-response-body')[0];
//         const responseEditor = review.getElementsByClassName('review-response-input')[0];
//         responseEditor.style.display = "block";
//
//         if (responseBody) {
//             const responseText = responseBody.getElementsByClassName('response-body-text')[0].innerText;
//             responseEditor.getElementsByTagName('textarea')[0].value = responseText;
//             responseBody.style.display = "none";
//         }
//     })
// }

const showReplyEditor = (el) => {
    const review = el.parentElement.parentElement.parentElement;

    const responseBody = review.getElementsByClassName('review-response-body')[0];
    const responseEditor = review.getElementsByClassName('review-response-input')[0];
    responseEditor.style.display = "block";

    if (responseBody) {
        const responseText = responseBody.getElementsByClassName('response-body-text')[0].innerText;
        responseEditor.getElementsByTagName('textarea')[0].value = responseText;
        responseBody.style.display = "none";
    }
}

// const cancelReplies = document.getElementsByClassName('response-comment-cancel')
// for (let cancel of cancelReplies) {
//     cancel.addEventListener('click', (e) => {
//         const review = e.target.parentElement.parentElement;
//
//         const responseBody = review.getElementsByClassName('review-response-body')[0];
//         const responseEditor = review.getElementsByClassName('review-response-input')[0];
//         responseEditor.style.display = "none";
//
//         if (responseBody) 
//             responseBody.style.display = "block";
//     });
// }

const cancelReply = (el) => {
    const review = el.parentElement.parentElement;

    const responseBody = review.getElementsByClassName('review-response-body')[0];
    const responseEditor = review.getElementsByClassName('review-response-input')[0];
    responseEditor.style.display = "none";

    if (responseBody) 
        responseBody.style.display = "block";
}

// const editReplies = document.getElementsByClassName('response-edit')
// for (let edit of editReplies) {
//     edit.addEventListener('click', (e) => {
//         const review = e.target.parentElement.parentElement.parentElement.parentElement;
//
//         const responseBody = review.getElementsByClassName('review-response-body')[0];
//         const responseEditor = review.getElementsByClassName('review-response-input')[0];
//         responseEditor.style.display = "block";
//
//         if (responseBody) {
//             const responseText = responseBody.getElementsByClassName('response-body-text')[0].innerText;
//             responseEditor.getElementsByTagName('textarea')[0].value = responseText;
//             responseBody.style.display = "none";
//         }
//     });
// }

const editReply = (el) => {
    const review = el.parentElement.parentElement.parentElement;

    const responseBody = review.getElementsByClassName('review-response-body')[0];
    const responseEditor = review.getElementsByClassName('review-response-input')[0];
    responseEditor.style.display = "block";

    if (responseBody) {
        const responseText = responseBody.getElementsByClassName('response-body-text')[0].innerText;
        responseEditor.getElementsByTagName('textarea')[0].value = responseText;
        responseBody.style.display = "none";
    }
}

// const deleteReplies = document.getElementsByClassName('response-delete')
// for (let delReply of deleteReplies) {
//     delReply.addEventListener('click', async (e) => {
//         const deleteConfirm = confirm('Delete reply?');
//         if (!deleteConfirm)
//             return
//
//         const review = e.target.parentElement.parentElement.parentElement.parentElement
//         const usrId = review.getAttribute('data-author');
//
//         const delReq = await fetch(`/respond/${usrId}`, {
//             method: 'DELETE',
//             headers: { 'Content-Type': 'application/json' },
//         });
//         const delRes = await delReq.json();
//
//         if (delRes.status == 200) {
//             alert("Sucessfully deleted response!");
//             window.location.reload();
//         } else {
//             alert(replyRes.message);
//         }
//     });
// }

const deleteReply = async (el) => {
    const deleteConfirm = confirm('Delete reply?');
    if (!deleteConfirm)
        return

    const review = el.parentElement.parentElement.parentElement
    const usrId = review.getAttribute('data-author');

    const delReq = await fetch(`/respond/${usrId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
    });
    const delRes = await delReq.json();

    if (delRes.status == 200) {
        alert("Sucessfully deleted response!");
        window.location.reload();
    } else {
        alert(delRes.message);
    }
}

const sendOwnerReply = async (e) => {
    const review = e.parentElement.parentElement;
    const usrId = review.getAttribute('data-author');
    
    const responseEditor = review.getElementsByClassName('review-response-input')[0];
    const textarea = responseEditor.getElementsByTagName('textarea')[0];

    const replyReq = await fetch(`/respond/${usrId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({comment: textarea.value}),
    });

    const replyRes = await replyReq.json();

    if (replyRes.status == 200) {
        alert("Sucessfully responded to user!");
        window.location.reload();
    } else {
        alert(replyRes.message);
    }
}

const saveOwnerReply = async (e) => {
    const review = e.parentElement.parentElement;
    const usrId = review.getAttribute('data-author');
    
    const responseEditor = review.getElementsByClassName('review-response-input')[0];
    const textarea = responseEditor.getElementsByTagName('textarea')[0];

    const replyReq = await fetch(`/respond/${usrId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({comment: textarea.value}),
    });

    const replyRes = await replyReq.json();

    console.log(replyRes)

    if (replyRes.status == 200) {
        alert("Sucessfully updated response!");
        window.location.reload();
    } else {
        alert(replyRes.message);
    }
}

// NON OWNER EXCLUSIVE STUFF

const markReview = async (e, action) => {
    // Yes it's scuffed, again, no, I won't fix this.
    const review = e.parentElement.parentElement.parentElement;
    const rid = review.getAttribute('data-reviewid');

    const markReq = await fetch(`/review/${action}/${rid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });

    const markRes = await markReq.json();

    if (markRes.status == 200) {
        const newHelpfulCount = markRes.data.helpfulCount;
        const newUnhelpfulCount = markRes.data.unhelpfulCount;

        e.parentElement.getElementsByClassName('review-helpful-count')[0].innerText = newHelpfulCount;
        e.parentElement.getElementsByClassName('review-unhelpful-count')[0].innerText = newUnhelpfulCount;
    }
}

const renderStarsHTML = (rating) => {
    let innerText
    if (rating === -1) {
        innerText = "No ratings";
    } else {
        const roundedRating = Math.round(rating);
        innerText = "★".repeat(roundedRating) + "☆".repeat(5 - roundedRating);
    }

    return `<span class="stars${rating == -1 ? '-no-ratings' : ''} star-rating">${innerText}</span>`
}

const createReviewHTML = (review) => {
    const responseSection = review.ownerResponse ? `
    <div class="review-response review-response-body">
        <p> 
            <strong>${review.ownerResponse.ownerId.username} </strong> 
        
            <span class="response-delete" onclick="deleteReply(this)">
                <i class="fa-solid fa-trash"></i>
            </span>
            <span class="response-edit" onclick="editReply(this)">
                <i class="fa-solid fa-pen"></i>
            </span>

            <br />
            <span class="response-body-text">
                ${review.ownerResponse.comment}
            </span>
        </p>
    </div>

    ` : '';

    const saveReplyButton = review.ownerResponse ? `
    <button class="response-comment-reply" onclick="saveOwnerReply(this)">Save</button> ` : `
    <button class="response-comment-reply" onclick="sendOwnerReply(this)">Reply</button>
    `;

    return `
    <div class="review" data-author="${review.userId._id}" data-reviewid="${review._id}">
        <div>
            <div class="review-header">
                <span>
                    <strong>${review.userId.username}</strong> • ${renderStarsHTML(review.rating)}
                </span>
                <span class="review-edited"> <em> ${review.edited? 'edited' : ''} </em> </span>
            </div>
            <p>${review.comment}</p>
        </div>
        <div class="review-actions">
            <span class="review-actions-left">
                <span onclick="markReview(this, 'helpful')">
                    <i class="fa-regular fa-thumbs-up"></i>
                    <span class="review-helpful-count"> ${review.helpfulCount} </span>
                </span>
                <span onclick="markReview(this, 'unhelpful')">
                    <i class="fa-regular fa-thumbs-down"></i>
                    <span class="review-unhelpful-count"> ${review.unhelpfulCount} </span>
                </span>
            </span>
            <span class="review-actions-right">
                <span class="review-reply" onclick="showReplyEditor(this)">
                    Reply
                </span>
            </span>
        </div>

        ${responseSection}

            <div class="review-response review-response-input">
                <textarea class="response-comment-input" placeholder="Write your reply here..." name="comment" oninput="adjustResponseInput(this)"></textarea> <br />
                <button class="response-comment-cancel" onclick="cancelReply(this)">Cancel</button>
                ${saveReplyButton}
            </div>
    </div>
    `
}

const renderReviews = async (rstrId, page = 1) => { 
    // no validation for count and offset here so prayge
    const count = 10
    const offset = (page-1) * 10

    var apiUrl = `/reviews/${rstrId}?offset=${offset}&count=${count}`;
    
    // Disable buttons temporarily so user doesn't spam them
    const reviewButtons = document.getElementById('reviews-page-buttons').getElementsByTagName('button');
    const backButton  = reviewButtons[0];
    const nextButton  = reviewButtons[1];
    backButton.disabled = true
    nextButton.disabled = true

    // If there is a search query
    const searchValueEl = document.getElementById('review-search-value');
    const searchQry = searchValueEl.value.trim();

    if (searchQry != '') {
        apiUrl += `&comment=${searchQry}`
    }

    const markReq = await fetch(apiUrl, {
        method: 'GET',
    });
    const revJson = await markReq.json();
    const revData = revJson.data;

    const reviews = revData?.reviews;

    // Clear all previous reviews
    const reviewsList = document.getElementById('reviews-list');
    reviewsList.innerHTML = '';

    for (let review of reviews) {
        reviewsList.innerHTML += createReviewHTML(review);
    }

    let realCount = Math.min(count, reviews?.length)

    // update reviews result count
    document.getElementById('reviews-result-count').innerText = `Showing ${realCount} results`;
    
    // update reviews page number result count
    document.getElementById('reviews-page-number').innerText = `Page ${page}`;
    
    // update page number
    document.getElementById('reviews-page').value = page;

    // update review-buttons
    backButton.disabled = page <= 1 ? true : false
    nextButton.disabled = reviews?.length < count ? true : false
}

const nextPageReviews = () => {
    // runs under the assumption this will be valid
    const pageNumber = Number(document.getElementById('reviews-page').value)
    renderReviews(establishmentId, pageNumber+1)
}

const prevPageReviews = () => {
    // runs under the assumption this will be valid
    const pageNumber = Number(document.getElementById('reviews-page').value)
    renderReviews(establishmentId, pageNumber-1)
}

const searchReviews = () => {
    const searchBar = document.getElementById('review-search-bar');
    const searchQuery = searchBar?.value.trim();

    const searchValueEl = document.getElementById('review-search-value');
    searchValueEl.value = searchQuery;

    renderReviews(establishmentId, 1) // render page 1 w/ the search query
}

window.addEventListener('DOMContentLoaded', (e) => {
    renderReviews(establishmentId)
})
