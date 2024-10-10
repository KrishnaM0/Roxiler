let month = document.querySelector("#months");
let searchform = document.querySelector("form");
month.addEventListener("change", () => {
    searchform.submit();
});

let next = document.querySelector(".nextbtn");
let previous = document.querySelector(".previousbtn");
let paginationForm = document.querySelector(".pagination-form");
let pageInput = document.querySelector(".pageInput");

let currentPage = Number(pageInput.value);
const totalPages = parseInt(next.getAttribute('data-total'));


next.addEventListener("click", () => {
    if(currentPage == totalPages){
        next.disabled = true;
        next.style.opacity = 0.5;  
    }
    else{
        currentPage += 1;
        pageInput.value = currentPage;
        paginationForm.submit();
        console.log(totalPages);
    };
   
});

previous.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage -= 1;
        pageInput.value = currentPage;
        paginationForm.submit();
    }
    else{
        previous.disabled = true;
        previous.style.opacity = 0.5;    
    };
});
