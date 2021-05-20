var mousecursor = document.querySelector('.cursor');

window.addEventListener('mousemove',cursor)

function cursor(e) {
  mousecursor.style.top = e.pageY + "px";
  mousecursor.style.left = e.pageX + "px";
}


