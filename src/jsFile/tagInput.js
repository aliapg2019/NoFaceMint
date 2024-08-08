import showNotification from "./createToken";
const selectedTags = [];

document.addEventListener('DOMContentLoaded', () => {
    const selectedTagsContainer = document.getElementById('selected-tags');
    const availableTagsContainer = document.getElementById('available-tags');
    let tagInput = document.getElementById('tag-input');
    const addTag = document.getElementById("add-tag")

    availableTagsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('tag')) {
            const tag = event.target.dataset.tag;
            if (selectedTags.length < 3 && !selectedTags.includes(tag)) {
                selectedTags.push(tag);
                updateSelectedTags();
            }
        }
    });

    selectedTagsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('remove-tag')) {
            const tag = event.target.dataset.tag;
            const index = selectedTags.indexOf(tag);
            if (index !== -1) {
                selectedTags.splice(index, 1);
                updateSelectedTags();
            }
        }
        console.log(tagInput);
    });

    tagInput.addEventListener('keyup', (event) => {
        event.preventDefault();

        console.log(tagInput.value.trim() !== '', tagInput.value);
        if (tagInput.value.trim() !== '' && event.key == "Enter") {
            const tag = tagInput.value.trim();
            if (selectedTags.length < 3 && !selectedTags.includes(tag)) {
                selectedTags.push(tag);
                updateSelectedTags();
                tagInput.value = '';

            }
            console.log("test tag", selectedTags);
        }

    });

    function updateSelectedTags() {
        selectedTagsContainer.innerHTML = '';
        selectedTags.forEach(tag => {
            const tagElement = document.createElement('div');
            tagElement.className = 'flex ml-2 items-center bg-purple-100 text-purple-700 px-1 py-1 rounded-full text-sm';
            tagElement.innerHTML = `
                <span class ="pl-1 ">${tag}</span>
                <button type="button" class="flex remove-tag ml-1 text-purple-700" data-tag="${tag}">
                    &times;
                </button>
            `;
            selectedTagsContainer.appendChild(tagElement);
        });
        if (selectedTags.length == 3) {
            tagInput.classList.add("hidden");

        } else {
            tagInput.classList.remove("hidden");
        }
    }

    return selectedTags;

});

function getSelectedTags(){
    return selectedTags;
}

export default getSelectedTags;