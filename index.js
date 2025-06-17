let title = document.getElementById("title");
let description = document.getElementById("desc");
let click = document.getElementById("submit");


const todo = {
  title:title.value,
  description:description.value,
};

title.onchange = function (e) { 
  console.log(e.target.value);
  todo.title = e.target.value;
};
description.onchange = function (e) {
  console.log(e.target.value);
  todo.description = e.target.value;
};

click.onclick = function () {
  fetch("http://localhost:3000/", {
    method: "POST",
    headers: {
      "Content-Type": "application/text",
    },
    body: "hello" // JSON.stringify(todo),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
    })
    .catch((e) => {
      console.log(e.message);
    });
};
