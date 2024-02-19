
const [output] = document.querySelectorAll('pre');
const [check, sync] = document.querySelectorAll('button');

output.textContent = 'Hello, world!';
check.onclick = () => {
  output.textContent = 'TODO check';
}
sync.onclick = () => {
  output.textContent = 'TODO sync';
}
