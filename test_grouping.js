const qs = [
  { questionNumber: '1a', marks: 5, text: 'hi' },
  { questionNumber: '1b', marks: 5, text: 'hello' },
  { questionNumber: '2a', marks: 10, text: 'hey' }
];

const grouped = {};
qs.forEach(q => {
  const match = q.questionNumber.match(/^(\d+)([a-zA-Z]*)$/);
  if (match) {
    const [_, num, sub] = match;
    if (!grouped[num]) grouped[num] = [];
    grouped[num].push({ ...q, sub_question: sub });
  }
});
console.log(grouped);
