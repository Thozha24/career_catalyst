// Seed script — realistic demo data for development.
// Run: npm run db:seed
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ACHIEVEMENTS = [
  { code: "FIRST_LESSON", name: "First Steps", description: "Complete your first lesson", icon: "book-open", color: "#6366F1", pointsBonus: 10 },
  { code: "FIVE_LESSONS", name: "Bookworm", description: "Complete 5 lessons", icon: "book", color: "#8B5CF6", pointsBonus: 25 },
  { code: "FIRST_PROBLEM", name: "Hello, Algorithm", description: "Solve your first coding problem", icon: "code", color: "#06B6D4", pointsBonus: 10 },
  { code: "FIVE_PROBLEMS", name: "Problem Crusher", description: "Solve 5 coding problems", icon: "terminal", color: "#10B981", pointsBonus: 25 },
  { code: "FIRST_TEST", name: "Test Pilot", description: "Complete your first test", icon: "clipboard-check", color: "#F59E0B", pointsBonus: 10 },
  { code: "PERFECT_SCORE", name: "Flawless", description: "Score 100% on a test", icon: "target", color: "#EF4444", pointsBonus: 50 },
  { code: "STREAK_7", name: "On Fire", description: "Maintain a 7-day learning streak", icon: "flame", color: "#F97316", pointsBonus: 30 },
  { code: "TASK_MASTER", name: "Task Master", description: "Complete 5 mentor tasks", icon: "check-square", color: "#6366F1", pointsBonus: 25 },
  { code: "POINTS_500", name: "Point Collector", description: "Earn 500 total points", icon: "star", color: "#EAB308", pointsBonus: 0 },
  { code: "POINTS_1000", name: "Catalyst", description: "Earn 1,000 total points", icon: "zap", color: "#8B5CF6", pointsBonus: 0 },
];

function lesson(title, content, codeExample, quiz, pointsAward = 10) {
  return { title, content, codeExample, quiz: JSON.stringify(quiz), pointsAward };
}

const COURSES = [
  {
    title: "HTML Foundations", slug: "html-foundations", category: "HTML", level: "Beginner", order: 1,
    coverGradient: "from-orange-500 to-red-500",
    description: "Learn the building blocks of the web: semantic markup, forms, media and accessibility essentials.",
    modules: [
      { title: "Getting Started", lessons: [
        lesson("What is HTML?", "HTML (HyperText Markup Language) describes the **structure** of a web page.\n\nEvery page is a tree of elements. Browsers parse this tree (the DOM) and render it.\n\n- Elements have tags: `<p>`, `<h1>`, `<a>`\n- Attributes add metadata: `href`, `src`, `alt`\n- Semantic elements describe meaning: `<header>`, `<nav>`, `<main>`, `<footer>`", `<!DOCTYPE html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <title>My first page</title>\n  </head>\n  <body>\n    <h1>Hello, world</h1>\n    <p>My first paragraph.</p>\n  </body>\n</html>`, [{ question: "Which element contains the visible page content?", options: ["<head>", "<body>", "<html>", "<title>"], answerIndex: 1 }]),
        lesson("Text & Links", "Headings run `<h1>` (most important) to `<h6>`. Use one `<h1>` per page.\n\nLinks use `<a href>`. Images use `<img src alt>` — **always** provide alt text for accessibility.\n\nLists come in two flavors: `<ul>` (unordered) and `<ol>` (ordered).", `<a href=\"https://example.com\">A link</a>\n<img src=\"cat.jpg\" alt=\"A sleeping cat\" />\n<ul>\n  <li>First item</li>\n  <li>Second item</li>\n</ul>`, [{ question: "Which attribute makes an image accessible?", options: ["title", "src", "alt", "longdesc"], answerIndex: 2 }]),
      ]},
      { title: "Forms & Semantics", lessons: [
        lesson("Forms & Inputs", "Forms collect user input with `<form>`, `<input>`, `<select>`, `<textarea>` and `<button>`.\n\nAlways pair inputs with `<label for>` — it powers screen readers and bigger tap targets.\n\nInput types (`email`, `number`, `date`) give free validation and better mobile keyboards.", `<form action=\"/signup\" method=\"post\">\n  <label for=\"email\">Email</label>\n  <input id=\"email\" name=\"email\" type=\"email\" required />\n  <button type=\"submit\">Join</button>\n</form>`, [{ question: "Which attribute connects a label to its input?", options: ["name", "for", "aria", "id-ref"], answerIndex: 1 }]),
      ]},
    ],
  },
  {
    title: "CSS Essentials", slug: "css-essentials", category: "CSS", level: "Beginner", order: 2,
    coverGradient: "from-blue-500 to-cyan-500",
    description: "Style beautiful, responsive layouts with selectors, the box model, flexbox and grid.",
    modules: [
      { title: "Styling Basics", lessons: [
        lesson("Selectors & Specificity", "CSS applies styles by matching **selectors**.\n\n- Type: `p { }`\n- Class: `.btn { }`\n- ID: `#hero { }`\n\nSpecificity order: type < class < id < inline style. Prefer classes — they keep styles reusable.\n\nThe cascade means later rules of equal specificity win.", `.btn {\n  background: #6366F1;\n  color: white;\n  padding: 10px 18px;\n  border-radius: 12px;\n}\n.btn:hover {\n  background: #4F46E5;\n}`, [{ question: "Which selector has the HIGHEST specificity?", options: [".card", "div", "#main", "p span"], answerIndex: 2 }]),
        lesson("Flexbox Layout", "Flexbox lays out children along one axis.\n\nSet `display: flex` on a parent, then control distribution with `justify-content` (main axis) and `align-items` (cross axis). `gap` adds spacing without margins.", `.toolbar {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n}`, [{ question: "Which property centers items on the cross axis?", options: ["justify-content", "align-items", "gap", "order"], answerIndex: 1 }]),
      ]},
      { title: "Responsive Design", lessons: [
        lesson("Media Queries & Grid", "Media queries apply styles conditionally — the backbone of responsive design.\n\nCSS Grid handles two-dimensional layouts. Combine with `minmax()` and `auto-fit` for fluid card grids without breakpoints.", `.cards {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));\n  gap: 16px;\n}\n\n@media (max-width: 640px) {\n  .sidebar { display: none; }\n}`, [{ question: "What does 1fr mean in grid-template-columns?", options: ["One font unit", "One fraction of free space", "One frame", "A fixed 1px row"], answerIndex: 1 }]),
      ]},
    ],
  },
  {
    title: "JavaScript Fundamentals", slug: "javascript-fundamentals", category: "JavaScript", level: "Beginner", order: 3,
    coverGradient: "from-yellow-400 to-amber-500",
    description: "Variables, functions, arrays, objects, DOM manipulation and modern ES6+ patterns.",
    modules: [
      { title: "Language Basics", lessons: [
        lesson("Variables & Types", "Use `const` by default and `let` only when reassigning. Avoid `var`.\n\nPrimitives: string, number, boolean, null, undefined, symbol, bigint. Everything else is an object — including arrays and functions.\n\n`===` compares value AND type; always prefer it over `==`.", "const name = \"Ada\";\nlet score = 0;\nscore = score + 10;\n\nconsole.log(`${name} scored ${score}`); // template literal", [{ question: "Which keyword declares a block-scoped constant?", options: ["var", "let", "const", "static"], answerIndex: 2 }]),
        lesson("Functions & Arrow Syntax", "Functions are values — pass them around, return them, store them.\n\nArrow functions have concise syntax and inherit `this` from their surroundings.", "const double = (n) => n * 2;\n\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\n[1, 2, 3].map(double); // [2, 4, 6]", [{ question: "What does [1,2,3].map(double) return when double = n => n*2?", options: ["[1,2,3]", "[2,4,6]", "6", "undefined"], answerIndex: 1 }]),
      ]},
      { title: "Data & DOM", lessons: [
        lesson("Arrays & Objects", "Arrays: `map`, `filter`, `reduce` transform data without loops.\n\nObjects: destructure for clarity, spread for copies.\n\nThese three array methods appear in virtually every codebase.", "const users = [\n  { name: \"Ada\", age: 36 },\n  { name: \"Alan\", age: 41 },\n];\n\nconst names = users.map(u => u.name);\nconst older = users.filter(u => u.age > 40);\nconst totalAge = users.reduce((sum, u) => sum + u.age, 0);", [{ question: "Which method builds a new array from each item?", options: ["forEach", "map", "reduce", "push"], answerIndex: 1 }]),
        lesson("The DOM & Events", "Select elements with `querySelector`, react to users with `addEventListener`.\n\nKeep DOM work batched — reading and writing in alternation causes layout thrashing.", "const btn = document.querySelector(\"#save\");\n\nbtn.addEventListener(\"click\", () => {\n  document.querySelector(\"#status\").textContent = \"Saved!\";\n});", [{ question: "Which method attaches an event handler?", options: ["onEvent()", "attach()", "addEventListener()", "listen()"], answerIndex: 2 }]),
      ]},
    ],
  },
  {
    title: "Python for Beginners", slug: "python-for-beginners", category: "Python", level: "Beginner", order: 4,
    coverGradient: "from-emerald-500 to-teal-500",
    description: "Python syntax, data structures, control flow and writing your first real programs.",
    modules: [
      { title: "Python Basics", lessons: [
        lesson("Variables & Printing", "Python uses dynamic typing — no type declarations needed. Indentation (4 spaces) defines blocks.\n\nf-strings format text elegantly.", "name = \"Ada\"\nage = 36\nprint(f\"{name} is {age} years old\")\n\nx, y = 1, 2  # tuple unpacking", [{ question: "How does Python define code blocks?", options: ["Curly braces", "Indentation", "begin/end keywords", "Semicolons"], answerIndex: 1 }]),
        lesson("Lists, Dicts & Loops", "Lists are ordered and mutable; dicts map keys to values.\n\n`for` loops iterate over any iterable — no counters needed.", "scores = [88, 92, 79]\nscores.append(95)\n\nperson = {\"name\": \"Ada\", \"role\": \"student\"}\n\nfor s in scores:\n    print(s)\n\nfor key, value in person.items():\n    print(key, value)", [{ question: "Which structure maps keys to values?", options: ["list", "tuple", "dict", "set"], answerIndex: 2 }]),
      ]},
    ],
  },
  {
    title: "Data Structures 101", slug: "data-structures-101", category: "Data Structures", level: "Intermediate", order: 5,
    coverGradient: "from-violet-500 to-purple-600",
    description: "Arrays, stacks, queues, hash maps and trees — with complexity intuition you'll use in interviews.",
    modules: [
      { title: "Core Structures", lessons: [
        lesson("Big-O Intuition", "Big-O describes how work grows with input size n.\n\n- O(1): instant — array index access\n- O(log n): halving — binary search\n- O(n): one pass — summing a list\n- O(n²): nested loops — bubble sort\n\nInterviewers care less about memorization and more about *reasoning*: 'what happens when n doubles?'", "# O(n) — one pass\n total = 0\nfor x in nums:\n    total += x\n\n# O(n^2) — nested pass\nfor a in nums:\n    for b in nums:\n        if a + b == target:\n            print(a, b)", [{ question: "Binary search on a sorted array is:", options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"], answerIndex: 1 }]),
        lesson("Stacks & Queues", "A **stack** is LIFO — last in, first out (undo, browser back). A **queue** is FIFO — first in, first out (task scheduling).\n\nBoth are O(1) push/pop at their working ends.", "stack = []\nstack.append(1)   # push\nstack.append(2)\nstack.pop()       # 2 (LIFO)\n\nfrom collections import deque\nqueue = deque([1, 2])\nqueue.append(3)\nqueue.popleft()   # 1 (FIFO)", [{ question: "Which structure is Last-In-First-Out?", options: ["Queue", "Stack", "Heap", "Linked list"], answerIndex: 1 }]),
      ]},
    ],
  },
  {
    title: "Git & GitHub Crash Course", slug: "git-github-crash-course", category: "Git/GitHub", level: "Beginner", order: 6,
    coverGradient: "from-slate-600 to-slate-800",
    description: "Version control essentials: commits, branches, pull requests and collaboration workflow.",
    modules: [
      { title: "Version Control Basics", lessons: [
        lesson("Commits & Branches", "Git snapshots your project. A **commit** is a named snapshot; a **branch** is a line of development.\n\nWorkflow: edit → `git add` → `git commit -m` → repeat. Branch before starting new work.", "git status\ngit add .\ngit commit -m \"Add hero section\"\ngit switch -c feature/navbar\ngit push -u origin feature/navbar", [{ question: "Which command creates and switches to a new branch?", options: ["git branch -d", "git switch -c", "git checkout --", "git commit -b"], answerIndex: 1 }]),
        lesson("Pull Requests", "A pull request proposes merging your branch into another. Reviewers comment, request changes, then merge.\n\nSmall PRs get better reviews — keep them focused.", "# After pushing your branch, open a PR on GitHub:\n# 1. Compare & pull request\n# 2. Describe the change\n# 3. Request reviewers\ngit pull origin main  # stay up to date", [{ question: "What is the purpose of a pull request?", options: ["Delete branches", "Propose & review a merge", "Reset history", "Duplicate a repo"], answerIndex: 1 }]),
      ]},
    ],
  },
];

const CODING_PROBLEMS = [
  {
    slug: "sum-of-array", title: "Sum of Array", difficulty: "EASY", category: "Arrays", order: 1, pointsAward: 20,
    description: "Given an array of N integers, print their sum.\n\nThis is the classic warm-up: read the input, iterate, accumulate.",
    inputFormat: "First line: N (the number of elements).\nSecond line: N space-separated integers.",
    outputFormat: "A single integer — the sum of the elements.",
    constraints: "1 ≤ N ≤ 1000\n0 ≤ each element ≤ 10^6",
    testCases: JSON.stringify([
      { input: "5\n1 2 3 4 5", expectedOutput: "15", hidden: false },
      { input: "3\n10 20 30", expectedOutput: "60", hidden: true },
      { input: "1\n42", expectedOutput: "42", hidden: true },
    ]),
    starterCode: JSON.stringify({
      javascript: "function main(input) {\n  const lines = input.trim().split('\\n');\n  const n = Number(lines[0]);\n  const nums = lines[1].split(' ').map(Number);\n  // TODO: print the sum\n  console.log(nums.slice(0, n).reduce((a, b) => a + b, 0));\n}\n",
      python: "def main():\n    n = int(input())\n    nums = list(map(int, input().split()))\n    # TODO: print the sum\n    print(sum(nums[:n]))\n\nmain()\n",
      java: "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        long sum = 0;\n        for (int i = 0; i < n; i++) sum += sc.nextInt();\n        System.out.println(sum);\n    }\n}\n",
      cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    int n; \n    cin >> n;\n    long long sum = 0;\n    for (int i = 0; i < n; i++) { int x; cin >> x; sum += x; }\n    cout << sum << endl;\n    return 0;\n}\n",
    }),
  },
  {
    slug: "reverse-a-string", title: "Reverse a String", difficulty: "EASY", category: "Strings", order: 2, pointsAward: 20,
    description: "Given a string, print it reversed.\n\nTry solving it without built-in reverse functions first, then compare with the one-liner.",
    inputFormat: "A single line of text (may contain spaces).",
    outputFormat: "The reversed string.",
    constraints: "1 ≤ length ≤ 1000",
    testCases: JSON.stringify([
      { input: "career", expectedOutput: "reerac", hidden: false },
      { input: "hello world", expectedOutput: "dlrow olleh", hidden: true },
    ]),
    starterCode: JSON.stringify({
      javascript: "function main(input) {\n  const s = input.trim();\n  // TODO: print s reversed\n  console.log(s.split('').reverse().join(''));\n}\n",
      python: "def main():\n    s = input()\n    # TODO: print s reversed\n    print(s[::-1])\n\nmain()\n",
      java: "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.nextLine();\n        System.out.println(new StringBuilder(s).reverse().toString());\n    }\n}\n",
      cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    string s;\n    getline(cin, s);\n    reverse(s.begin(), s.end());\n    cout << s << endl;\n    return 0;\n}\n",
    }),
  },
  {
    slug: "fizzbuzz", title: "FizzBuzz", difficulty: "EASY", category: "Loops", order: 3, pointsAward: 20,
    description: "Print numbers 1 to N, one per line. For multiples of 3 print \"Fizz\", for multiples of 5 print \"Buzz\", and for multiples of both print \"FizzBuzz\".\n\nThe world's most famous interview warm-up.",
    inputFormat: "A single integer N.",
    outputFormat: "N lines as described above.",
    constraints: "1 ≤ N ≤ 1000",
    testCases: JSON.stringify([
      { input: "5", expectedOutput: "1\n2\nFizz\n4\nBuzz", hidden: false },
      { input: "15", expectedOutput: "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz", hidden: true },
    ]),
    starterCode: JSON.stringify({
      javascript: "function main(input) {\n  const n = Number(input.trim());\n  // TODO: fizzbuzz\n  for (let i = 1; i <= n; i++) {\n    if (i % 15 === 0) console.log('FizzBuzz');\n    else if (i % 3 === 0) console.log('Fizz');\n    else if (i % 5 === 0) console.log('Buzz');\n    else console.log(i);\n  }\n}\n",
      python: "def main():\n    n = int(input())\n    # TODO: fizzbuzz\n    for i in range(1, n + 1):\n        if i % 15 == 0: print(\"FizzBuzz\")\n        elif i % 3 == 0: print(\"Fizz\")\n        elif i % 5 == 0: print(\"Buzz\")\n        else: print(i)\n\nmain()\n",
      java: "public class Main {\n    public static void main(String[] args) {\n        int n = new java.util.Scanner(System.in).nextInt();\n        for (int i = 1; i <= n; i++) {\n            if (i % 15 == 0) System.out.println(\"FizzBuzz\");\n            else if (i % 3 == 0) System.out.println(\"Fizz\");\n            else if (i % 5 == 0) System.out.println(\"Buzz\");\n            else System.out.println(i);\n        }\n    }\n}\n",
      cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    for (int i = 1; i <= n; i++) {\n        if (i % 15 == 0) cout << \"FizzBuzz\\n\";\n        else if (i % 3 == 0) cout << \"Fizz\\n\";\n        else if (i % 5 == 0) cout << \"Buzz\\n\";\n        else cout << i << \"\\n\";\n    }\n    return 0;\n}\n",
    }),
  },
  {
    slug: "palindrome-check", title: "Palindrome Check", difficulty: "EASY", category: "Strings", order: 4, pointsAward: 25,
    description: "Given a word, print \"true\" if it reads the same forwards and backwards, otherwise \"false\". Ignore case.",
    inputFormat: "A single word.",
    outputFormat: "\"true\" or \"false\".",
    constraints: "1 ≤ length ≤ 100",
    testCases: JSON.stringify([
      { input: "level", expectedOutput: "true", hidden: false },
      { input: "catalyst", expectedOutput: "false", hidden: false },
      { input: "Racecar", expectedOutput: "true", hidden: true },
    ]),
    starterCode: JSON.stringify({
      javascript: "function main(input) {\n  const s = input.trim().toLowerCase();\n  // TODO: check palindrome\n  console.log(s === s.split('').reverse().join(''));\n}\n",
      python: "def main():\n    s = input().strip().lower()\n    # TODO: check palindrome\n    print(str(s == s[::-1]).lower())\n\nmain()\n",
      java: "public class Main {\n    public static void main(String[] args) {\n        String s = new java.util.Scanner(System.in).next().toLowerCase();\n        boolean ok = true;\n        for (int i = 0; i < s.length() / 2; i++) {\n            if (s.charAt(i) != s.charAt(s.length() - 1 - i)) { ok = false; break; }\n        }\n        System.out.println(ok);\n    }\n}\n",
      cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    string s;\n    cin >> s;\n    transform(s.begin(), s.end(), s.begin(), ::tolower);\n    string r = s;\n    reverse(r.begin(), r.end());\n    cout << (s == r ? \"true\" : \"false\") << endl;\n    return 0;\n}\n",
    }),
  },
  {
    slug: "two-sum", title: "Two Sum", difficulty: "MEDIUM", category: "Arrays", order: 5, pointsAward: 40,
    description: "Given an array of N integers and a target T, print the indices (0-based) of the two numbers that add up to T. Exactly one solution exists.\n\nBonus: solve it in O(n) with a hash map instead of O(n²) brute force.",
    inputFormat: "First line: N.\nSecond line: N space-separated integers.\nThird line: target T.",
    outputFormat: "Two space-separated indices, smallest first.",
    constraints: "2 ≤ N ≤ 10^4\n-10^9 ≤ element, T ≤ 10^9",
    testCases: JSON.stringify([
      { input: "4\n2 7 11 15\n9", expectedOutput: "0 1", hidden: false },
      { input: "3\n3 2 4\n6", expectedOutput: "1 2", hidden: true },
    ]),
    starterCode: JSON.stringify({
      javascript: "function main(input) {\n  const lines = input.trim().split('\\n');\n  const nums = lines[1].split(' ').map(Number);\n  const target = Number(lines[2]);\n  // TODO: find two indices that sum to target\n  const seen = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const need = target - nums[i];\n    if (seen.has(need)) { console.log(seen.get(need), i); return; }\n    seen.set(nums[i], i);\n  }\n}\n",
      python: "def main():\n    n = int(input())\n    nums = list(map(int, input().split()))\n    target = int(input())\n    # TODO: find two indices that sum to target\n    seen = {}\n    for i, x in enumerate(nums):\n        if target - x in seen:\n            print(seen[target - x], i)\n            return\n        seen[x] = i\n\nmain()\n",
      java: "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] nums = new int[n];\n        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n        int target = sc.nextInt();\n        Map<Integer, Integer> seen = new HashMap<>();\n        for (int i = 0; i < n; i++) {\n            if (seen.containsKey(target - nums[i])) {\n                System.out.println(seen.get(target - nums[i]) + \" \" + i);\n                return;\n            }\n            seen.put(nums[i], i);\n        }\n    }\n}\n",
      cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    vector<long long> nums(n);\n    for (auto &x : nums) cin >> x;\n    long long target; cin >> target;\n    unordered_map<long long, int> seen;\n    for (int i = 0; i < n; i++) {\n        auto it = seen.find(target - nums[i]);\n        if (it != seen.end()) { cout << it->second << \" \" << i << endl; return 0; }\n        seen[nums[i]] = i;\n    }\n    return 0;\n}\n",
    }),
  },
  {
    slug: "max-element", title: "Maximum Element", difficulty: "EASY", category: "Arrays", order: 6, pointsAward: 15,
    description: "Find the largest number in an array.",
    inputFormat: "First line: N.\nSecond line: N space-separated integers.",
    outputFormat: "The maximum element.",
    constraints: "1 ≤ N ≤ 10^5",
    testCases: JSON.stringify([
      { input: "5\n3 9 1 7 4", expectedOutput: "9", hidden: false },
      { input: "3\n-5 -2 -9", expectedOutput: "-2", hidden: true },
    ]),
    starterCode: JSON.stringify({
      javascript: "function main(input) {\n  const lines = input.trim().split('\\n');\n  const nums = lines[1].split(' ').map(Number);\n  // TODO: print the maximum\n  console.log(Math.max(...nums));\n}\n",
      python: "def main():\n    n = int(input())\n    nums = list(map(int, input().split()))\n    # TODO: print the maximum\n    print(max(nums))\n\nmain()\n",
      java: "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int best = Integer.MIN_VALUE;\n        for (int i = 0; i < n; i++) best = Math.max(best, sc.nextInt());\n        System.out.println(best);\n    }\n}\n",
      cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    long long best = LLONG_MIN;\n    for (int i = 0; i < n; i++) { long long x; cin >> x; best = max(best, x); }\n    cout << best << endl;\n    return 0;\n}\n",
    }),
  },
  {
    slug: "count-vowels", title: "Count Vowels", difficulty: "EASY", category: "Strings", order: 7, pointsAward: 15,
    description: "Count the vowels (a, e, i, o, u — case insensitive) in a line of text.",
    inputFormat: "A single line of text.",
    outputFormat: "The number of vowels.",
    constraints: "1 ≤ length ≤ 10^4",
    testCases: JSON.stringify([
      { input: "Career Catalyst", expectedOutput: "5", hidden: false },
      { input: "xyz", expectedOutput: "0", hidden: true },
    ]),
    starterCode: JSON.stringify({
      javascript: "function main(input) {\n  const s = input.trim().toLowerCase();\n  // TODO: count vowels\n  console.log((s.match(/[aeiou]/g) || []).length);\n}\n",
      python: "def main():\n    s = input().strip().lower()\n    # TODO: count vowels\n    print(sum(1 for c in s if c in \"aeiou\"))\n\nmain()\n",
      java: "public class Main {\n    public static void main(String[] args) {\n        String s = new java.util.Scanner(System.in).nextLine().toLowerCase();\n        int count = 0;\n        for (char c : s.toCharArray()) {\n            if (\"aeiou\".indexOf(c) >= 0) count++;\n        }\n        System.out.println(count);\n    }\n}\n",
      cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    string s;\n    getline(cin, s);\n    transform(s.begin(), s.end(), s.begin(), ::tolower);\n    int count = 0;\n    for (char c : s) if (string(\"aeiou\").find(c) != string::npos) count++;\n    cout << count << endl;\n    return 0;\n}\n",
    }),
  },
  {
    slug: "fibonacci-nth", title: "Nth Fibonacci", difficulty: "MEDIUM", category: "Dynamic Programming", order: 8, pointsAward: 40,
    description: "Print the Nth Fibonacci number. The sequence starts F(1) = 0, F(2) = 1, F(n) = F(n-1) + F(n-2).\n\nRecursive solutions time out for large N — try iteration or memoization.",
    inputFormat: "A single integer N.",
    outputFormat: "F(N).",
    constraints: "1 ≤ N ≤ 70",
    testCases: JSON.stringify([
      { input: "1", expectedOutput: "0", hidden: false },
      { input: "10", expectedOutput: "34", hidden: true },
      { input: "50", expectedOutput: "7778742049", hidden: true },
    ]),
    starterCode: JSON.stringify({
      javascript: "function main(input) {\n  const n = Number(input.trim());\n  // TODO: print the nth fibonacci\n  let a = 0, b = 1;\n  for (let i = 1; i < n - 1; i++) [a, b] = [b, a + b];\n  console.log(n === 1 ? 0 : b);\n}\n",
      python: "def main():\n    n = int(input())\n    # TODO: print the nth fibonacci\n    a, b = 0, 1\n    for _ in range(n - 2):\n        a, b = b, a + b\n    print(0 if n == 1 else b)\n\nmain()\n",
      java: "public class Main {\n    public static void main(String[] args) {\n        int n = new java.util.Scanner(System.in).nextInt();\n        java.math.BigInteger a = java.math.BigInteger.ZERO, b = java.math.BigInteger.ONE;\n        for (int i = 1; i < n - 1; i++) { java.math.BigInteger t = a.add(b); a = b; b = t; }\n        System.out.println(n == 1 ? java.math.BigInteger.ZERO : b);\n    }\n}\n",
      cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    unsigned long long a = 0, b = 1;\n    for (int i = 1; i < n - 1; i++) { unsigned long long t = a + b; a = b; b = t; }\n    cout << (n == 1 ? 0ULL : b) << endl;\n    return 0;\n}\n",
    }),
  },
];

async function main() {
  console.log("🌱 Seeding Career Catalyst demo data…");

  // ─── Achievements catalog ──────────────────────────────────────────────────
  for (const a of ACHIEVEMENTS) {
    await prisma.achievement.upsert({ where: { code: a.code }, create: a, update: a });
  }

  const passwordHash = await bcrypt.hash("Password123!", 12);

  // ─── Demo users ────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: "admin@careercatalyst.dev" },
    update: {},
    create: {
      email: "admin@careercatalyst.dev", passwordHash, fullName: "Platform Admin",
      role: "ADMIN", status: "ACTIVE", emailVerified: true,
    },
  });

  const mentor = await prisma.user.upsert({
    where: { email: "mentor@careercatalyst.dev" },
    update: {},
    create: {
      email: "mentor@careercatalyst.dev", passwordHash, fullName: "Maya Rodriguez",
      role: "MENTOR", status: "ACTIVE", emailVerified: true,
      mentorProfile: {
        create: {
          title: "Senior Software Engineer", organization: "TechFlow Inc.", yearsExperience: 9,
          expertise: "React, Node.js, System Design", skills: "JavaScript, TypeScript, AWS, PostgreSQL",
          bio: "I've mentored 200+ junior developers into their first roles. I focus on practical, project-based learning.",
          phone: "+1 555 010 1999",
        },
      },
    },
  });

  const studentDefs = [
    { email: "student@careercatalyst.dev", fullName: "Alex Chen", college: "State University", course: "B.Tech Computer Science", graduationYear: 2027, skills: "JavaScript, Python, HTML, CSS", interests: "Web development, AI", points: 640, streak: 6 },
    { email: "priya@careercatalyst.dev", fullName: "Priya Sharma", college: "State University", course: "B.Sc Information Technology", graduationYear: 2026, skills: "Java, SQL, Git", interests: "Backend engineering", points: 890, streak: 11 },
    { email: "daniel@careercatalyst.dev", fullName: "Daniel Okafor", college: "Metro College", course: "BCA", graduationYear: 2028, skills: "Python, C++", interests: "Competitive programming", points: 410, streak: 3 },
    { email: "aisha@careercatalyst.dev", fullName: "Aisha Khan", college: "State University", course: "B.E. Software Engineering", graduationYear: 2026, skills: "JavaScript, React, Node.js", interests: "Full-stack development", points: 1150, streak: 14 },
    { email: "tom@careercatalyst.dev", fullName: "Tom Nguyen", college: "Metro College", course: "B.Tech IT", graduationYear: 2027, skills: "HTML, CSS, JavaScript", interests: "UI/UX, frontend", points: 240, streak: 1 },
  ];

  const students = [];
  for (const s of studentDefs) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        email: s.email, passwordHash, fullName: s.fullName, role: "STUDENT",
        status: "ACTIVE", emailVerified: true,
        studentProfile: {
          create: {
            college: s.college, course: s.course, graduationYear: s.graduationYear,
            skills: s.skills, interests: s.interests, codingLanguages: s.skills,
            totalPoints: s.points, weeklyPoints: Math.round(s.points / 5), monthlyPoints: Math.round(s.points / 2),
            currentStreak: s.streak, longestStreak: s.streak + 4, lastActivityDate: new Date(),
            mentorId: mentor.id,
            bio: `${s.fullName} — passionate about ${s.interests.toLowerCase()}.`,
          },
        },
      },
    });
    students.push({ user, def: s });
  }

  // ─── Group ─────────────────────────────────────────────────────────────────
  const group = await prisma.group.upsert({
    where: { inviteCode: "cc-frontend-2026" },
    update: {},
    create: {
      name: "Frontend Development — Batch 2026",
      description: "A mentor-led cohort mastering modern frontend: HTML, CSS, JavaScript, React patterns and interview prep.",
      mentorId: mentor.id,
      inviteCode: "cc-frontend-2026",
    },
  });
  for (const { user } of students) {
    await prisma.groupMember.upsert({
      where: { groupId_studentId: { groupId: group.id, studentId: user.id } },
      update: {},
      create: { groupId: group.id, studentId: user.id },
    });
  }

  // ─── Courses / modules / lessons ───────────────────────────────────────────
  for (const c of COURSES) {
    const course = await prisma.course.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        title: c.title, slug: c.slug, category: c.category, level: c.level,
        description: c.description, coverGradient: c.coverGradient, order: c.order,
      },
    });
    let mOrder = 0;
    for (const m of c.modules) {
      const mod = await prisma.module.create({
        data: { courseId: course.id, title: m.title, order: mOrder++ },
      });
      let lOrder = 0;
      for (const l of m.lessons) {
        await prisma.lesson.create({
          data: { moduleId: mod.id, title: l.title, content: l.content, codeExample: l.codeExample, quiz: l.quiz, order: lOrder++, pointsAward: l.pointsAward },
        });
      }
    }
  }

  // ─── Coding problems ───────────────────────────────────────────────────────
  for (const p of CODING_PROBLEMS) {
    await prisma.codingProblem.upsert({
      where: { slug: p.slug },
      update: {},
      create: { ...p, testCases: p.testCases, starterCode: p.starterCode },
    });
  }

  // ─── Demo test with questions ──────────────────────────────────────────────
  const existingTest = await prisma.test.findFirst({ where: { groupId: group.id, title: "JavaScript Fundamentals Check" } });
  if (!existingTest) {
    const test = await prisma.test.create({
      data: {
        title: "JavaScript Fundamentals Check",
        description: "A 15-minute diagnostic covering variables, functions and array methods.",
        durationMin: 15, groupId: group.id, createdBy: mentor.id, passingScore: 60,
        availableFrom: new Date(Date.now() - 24 * 3600 * 1000),
        availableUntil: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        questions: {
          create: [
            {
              type: "MCQ", prompt: "Which keyword declares a block-scoped variable that CAN be reassigned?", marks: 2, order: 0,
              explanation: "`let` is block-scoped and reassignable; `const` is block-scoped but not reassignable.",
              options: { create: [
                { text: "var", isCorrect: false, order: 0 },
                { text: "let", isCorrect: true, order: 1 },
                { text: "const", isCorrect: false, order: 2 },
                { text: "static", isCorrect: false, order: 3 },
              ]},
            },
            {
              type: "TRUE_FALSE", prompt: "In JavaScript, `2 === \"2\"` evaluates to true.", marks: 1, order: 1,
              explanation: "`===` compares type as well as value, and number !== string.",
              options: { create: [
                { text: "True", isCorrect: false, order: 0 },
                { text: "False", isCorrect: true, order: 1 },
              ]},
            },
            {
              type: "MULTI_SELECT", prompt: "Which of these are valid ways to create a new array?", marks: 3, order: 2,
              options: { create: [
                { text: "Array.from({length: 3})", isCorrect: true, order: 0 },
                { text: "[1, 2, 3]", isCorrect: true, order: 1 },
                { text: "new Array(3)", isCorrect: true, order: 2 },
                { text: "array(3)", isCorrect: false, order: 3 },
              ]},
            },
            {
              type: "SHORT_ANSWER", prompt: "Which array method transforms every element and returns a new array? (one word)", marks: 2, order: 3,
              explanation: "`map` returns a new array with each element transformed.",
              options: { create: [{ text: "map", isCorrect: true, order: 0 }] },
            },
          ],
        },
      },
    });

    // A demo attempt from Tom (submitted) for mentor review screens
    const tom = students[4].user;
    const attempt = await prisma.testAttempt.create({
      data: { testId: test.id, studentId: tom.id, status: "SUBMITTED", startedAt: new Date(Date.now() - 3600_000), submittedAt: new Date(Date.now() - 3300_000), timeTakenSec: 300, score: 5, percentage: 62.5, passed: true },
    });
    const questions = await prisma.testQuestion.findMany({ where: { testId: test.id }, include: { options: true }, orderBy: { order: "asc" } });
    for (const q of questions) {
      const correct = q.options.find((o) => o.isCorrect);
      const answeredCorrectly = q.order !== 2; // missed the multi-select
      await prisma.testAnswer.create({
        data: {
          attemptId: attempt.id, questionId: q.id, studentId: tom.id,
          selectedOptionIds: q.type === "SHORT_ANSWER" ? "[]" : JSON.stringify(answeredCorrectly ? [correct.id] : q.options.filter((o) => !o.isCorrect).slice(0, q.type === "MULTI_SELECT" ? 2 : 1).map((o) => o.id)),
          textAnswer: q.type === "SHORT_ANSWER" ? (answeredCorrectly ? "map" : "filter") : null,
          isCorrect: answeredCorrectly,
          marksAwarded: answeredCorrectly ? q.marks : 0,
        },
      });
    }
    await prisma.studentProfile.update({ where: { userId: tom.id }, data: { testsCompleted: 1, testsPassed: 1 } });

    // ─── Demo tasks ────────────────────────────────────────────────────────
    const task1 = await prisma.task.create({
      data: {
        title: "Build a Personal Portfolio Page",
        description: "Create a responsive personal portfolio with a hero section, project cards and a contact form using semantic HTML and CSS grid.",
        instructions: "Requirements:\n1. Semantic HTML5 elements\n2. Responsive layout (mobile-first)\n3. At least 3 project cards with hover effects\n4. Accessible form labels",
        dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        priority: "HIGH", pointsAward: 100, groupId: group.id, createdBy: mentor.id,
        resources: JSON.stringify([{ name: "MDN Semantics", url: "https://developer.mozilla.org/en-US/docs/Learn/HTML/Introduction_to_HTML/Document_and_website_structure" }]),
      },
    });
    await prisma.taskAssignment.createMany({
      data: students.map(({ user }) => ({ taskId: task1.id, studentId: user.id })),
    });

    const task2 = await prisma.task.create({
      data: {
        title: "Solve 3 Array Problems",
        description: "Complete 'Sum of Array', 'Reverse a String' and 'Two Sum' in the coding arena before the deadline.",
        instructions: "Focus on writing clean code with comments. Aim for the O(n) solution on Two Sum.",
        dueDate: new Date(Date.now() + 3 * 24 * 3600 * 1000),
        priority: "MEDIUM", pointsAward: 60, groupId: group.id, createdBy: mentor.id,
      },
    });
    await prisma.taskAssignment.createMany({
      data: students.map(({ user }) => ({ taskId: task2.id, studentId: user.id })),
    });

    // Priya already submitted task1; awaiting review
    const priya = students[1].user;
    await prisma.taskSubmission.create({
      data: { taskId: task1.id, studentId: priya.id, content: "Finished my portfolio! Used CSS grid for the project cards and added a dark-mode toggle. Deployed here: https://priya-portfolio.example.dev", status: "SUBMITTED" },
    });
    await prisma.taskAssignment.update({
      where: { taskId_studentId: { taskId: task1.id, studentId: priya.id } },
      data: { status: "SUBMITTED" },
    });

    // Alex completed task2
    const alex = students[0].user;
    await prisma.taskSubmission.create({
      data: { taskId: task2.id, studentId: alex.id, content: "All three problems solved and passing. Two Sum uses a hash map for O(n).", reviewedAt: new Date(), feedback: "Excellent work — clean solutions and great use of the hash map pattern.", pointsAwarded: 60, status: "COMPLETED" },
    });
    await prisma.taskAssignment.update({
      where: { taskId_studentId: { taskId: task2.id, studentId: alex.id } },
      data: { status: "COMPLETED" },
    });
    await prisma.studentProfile.update({ where: { userId: alex.id }, data: { tasksCompleted: 1 } });

    // ─── Announcement + feedback + notifications ───────────────────────────
    await prisma.announcement.create({
      data: { groupId: group.id, authorId: mentor.id, title: "Welcome to Batch 2026! 🎉", body: "Great to have you all here. Start with HTML Foundations, then join this week's test. Office hours: Thursdays 6 PM." },
    });
    await prisma.feedback.create({
      data: { authorId: mentor.id, recipientId: alex.id, comment: "Alex consistently ships clean, well-documented code. Keep it up!", rating: 5 },
    });
    await prisma.notification.createMany({
      data: [
        { userId: alex.id, type: "NEW_TEST", title: "New test: JavaScript Fundamentals Check", body: "15 minutes · passing score 60%", link: "/student/tests" },
        { userId: alex.id, type: "NEW_TASK", title: "New task: Build a Personal Portfolio Page", body: "Due in 7 days · 100 points", link: "/student/tasks" },
        { userId: alex.id, type: "MENTOR_FEEDBACK", title: "Maya left you feedback", body: "Alex consistently ships clean, well-documented code…", link: "/student/mentor" },
        { userId: priya.id, type: "TASK_DEADLINE", title: "Task due soon: Build a Personal Portfolio Page", body: "You submitted — awaiting review.", link: "/student/tasks" },
      ],
    });

    // Points ledger entries for leaderboard realism
    const reasons = ["LESSON_COMPLETED", "CODING_SOLVED", "TEST_PASSED", "TASK_COMPLETED", "STREAK_BONUS"];
    for (const { user, def } of students) {
      const entries = Math.min(6, Math.max(2, Math.round(def.points / 150)));
      for (let i = 0; i < entries; i++) {
        await prisma.pointsTransaction.create({
          data: {
            studentId: user.id, points: Math.round(def.points / entries),
            reason: reasons[i % reasons.length], description: "Seeded demo activity",
            createdAt: new Date(Date.now() - i * 36 * 3600 * 1000),
          },
        });
      }
    }
  }

  console.log("✅ Seed complete.");
  console.log("");
  console.log("Demo accounts (all passwords: Password123!)");
  console.log("  ADMIN   admin@careercatalyst.dev");
  console.log("  MENTOR  mentor@careercatalyst.dev");
  console.log("  STUDENT student@careercatalyst.dev (Alex Chen)");
  console.log("          priya@ / daniel@ / aisha@ / tom@  @careercatalyst.dev");
  console.log("  Group invite code: cc-frontend-2026");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
