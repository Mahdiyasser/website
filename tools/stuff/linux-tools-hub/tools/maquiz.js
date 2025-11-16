// --- Linux/Open Source Quiz ---
const zotQuizLinux = [
  { id: 1, question: "Who created the Linux kernel?", options: ["Linus Torvalds","Richard Stallman","Ken Thompson","Dennis Ritchie"], answer: "Linus Torvalds" },
  { id: 2, question: "What does GNU stand for?", options: ["GNU's Not Unix","Great New Utility","General Network Unix","Global Node Unit"], answer: "GNU's Not Unix" },
  { id: 3, question: "Which license is famous for open source software?", options: ["GPL","MIT","Apache","All of the above"], answer: "All of the above" },
  { id: 4, question: "Which OS is Linux based on?", options: ["Unix","DOS","Windows","MacOS"], answer: "Unix" },
  { id: 5, question: "What is the package manager for Debian?", options: ["apt","yum","pacman","dnf"], answer: "apt" },
  { id: 6, question: "What command shows the current directory?", options: ["pwd","cd","ls","dir"], answer: "pwd" },
  { id: 7, question: "Which Linux distro is known for its rolling releases?", options: ["Arch Linux","Ubuntu","Debian","Fedora"], answer: "Arch Linux" },
  { id: 8, question: "Who is the founder of the Free Software Foundation?", options: ["Richard Stallman","Linus Torvalds","Bill Gates","Steve Jobs"], answer: "Richard Stallman" },
  { id: 9, question: "Which editor is famous for Linux terminal use?", options: ["vim","Notepad","Sublime","Word"], answer: "vim" },
  { id: 10, question: "Linux is what type of software?", options: ["Open Source","Proprietary","Closed Source","Trialware"], answer: "Open Source" },
  { id: 11, question: "Which command lists files and directories?", options: ["ls","dir","list","show"], answer: "ls" },
  { id: 12, question: "Which shell is the default in most Linux distros?", options: ["Bash","Zsh","Fish","Tcsh"], answer: "Bash" },
  { id: 13, question: "Which distro is known for beginner-friendliness?", options: ["Ubuntu","Arch","Gentoo","Slackware"], answer: "Ubuntu" },
  { id: 14, question: "Which command is used to change file permissions?", options: ["chmod","chown","cp","mv"], answer: "chmod" },
  { id: 15, question: "What is the mascot of Linux?", options: ["Tux","Duke","Beastie","Pingu"], answer: "Tux" },
  { id: 16, question: "Which command shows disk usage?", options: ["df","du","ls","diskinfo"], answer: "df" },
  { id: 17, question: "Which kernel is the core of Linux?", options: ["Monolithic","Microkernel","Hybrid","Exokernel"], answer: "Monolithic" },
  { id: 18, question: "Which distro is famous for servers and enterprise use?", options: ["Red Hat","Ubuntu Desktop","Arch Linux","Kali"], answer: "Red Hat" },
  { id: 19, question: "Who maintains the Linux kernel?", options: ["Community & Linus Torvalds","Microsoft","Apple","IBM only"], answer: "Community & Linus Torvalds" },
  { id: 20, question: "Which command shows running processes?", options: ["ps","proc","top","jobs"], answer: "ps" },
  { id: 21, question: "What year was Linux first released?", options: ["1991","1985","2000","1995"], answer: "1991" },
  { id: 22, question: "Which license is copyleft?", options: ["GPL","MIT","Apache","BSD"], answer: "GPL" },
  { id: 23, question: "Which distro is known for security testing?", options: ["Kali Linux","Ubuntu","Debian","Manjaro"], answer: "Kali Linux" },
  { id: 24, question: "Which command moves files?", options: ["mv","cp","rm","mkdir"], answer: "mv" },
  { id: 25, question: "Which distro uses pacman?", options: ["Arch Linux","Debian","Fedora","Ubuntu"], answer: "Arch Linux" },
  { id: 26, question: "Which editor is lightweight and terminal-based?", options: ["nano","Word","Sublime","Notepad"], answer: "nano" },
  { id: 27, question: "Which command removes files?", options: ["rm","delete","erase","clear"], answer: "rm" },
  { id: 28, question: "Which command shows manual pages?", options: ["man","help","doc","guide"], answer: "man" },
  { id: 29, question: "Which is the first Linux distribution ever?", options: ["Slackware","Debian","Ubuntu","Red Hat"], answer: "Slackware" },
  { id: 30, question: "Which command copies files?", options: ["cp","mv","copy","clone"], answer: "cp" },
  { id: 31, question: "Which command displays network interfaces?", options: ["ifconfig","netstat","ipconfig","route"], answer: "ifconfig" },
  { id: 32, question: "Which is a Linux desktop environment?", options: ["GNOME","Windows XP","MacOS UI","DOS Shell"], answer: "GNOME" },
  { id: 33, question: "Which company sponsors Ubuntu development?", options: ["Canonical","Red Hat","Debian","Microsoft"], answer: "Canonical" },
  { id: 34, question: "Which command displays current users?", options: ["who","users","id","finger"], answer: "who" },
  { id: 35, question: "Which distro is known for source-based installation?", options: ["Gentoo","Ubuntu","Fedora","Arch"], answer: "Gentoo" },
  { id: 36, question: "Which command shows memory usage?", options: ["free","mem","top","htop"], answer: "free" },
  { id: 37, question: "Which Linux founder also created Git?", options: ["Linus Torvalds","Richard Stallman","Ken Thompson","Brian Kernighan"], answer: "Linus Torvalds" },
  { id: 38, question: "Which distro is a Debian derivative?", options: ["Ubuntu","Red Hat","Fedora","Arch"], answer: "Ubuntu" },
  { id: 39, question: "Which command changes the owner of a file?", options: ["chown","chmod","mv","cp"], answer: "chown" },
  { id: 40, question: "Which shell uses `oh-my-zsh`?", options: ["Zsh","Bash","Fish","Tcsh"], answer: "Zsh" },
  { id: 41, question: "Which command searches text in files?", options: ["grep","find","search","look"], answer: "grep" },
  { id: 42, question: "Which Linux kernel version is LTS?", options: ["Long-Term Support","Latest Only","Beta","Experimental"], answer: "Long-Term Support" },
  { id: 43, question: "Which command shows current directory tree?", options: ["tree","ls","pwd","dir"], answer: "tree" },
  { id: 44, question: "Which distro is lightweight for old PCs?", options: ["Lubuntu","Ubuntu","Fedora","Debian"], answer: "Lubuntu" },
  { id: 45, question: "Which command compresses files?", options: ["tar","zip","gzip","All of the above"], answer: "All of the above" },
  { id: 46, question: "Which command shows disk space usage by folders?", options: ["du","df","ls","find"], answer: "du" },
  { id: 47, question: "Which GUI file manager is common in Linux?", options: ["Nautilus","Explorer","Finder","File Manager"], answer: "Nautilus" },
  { id: 48, question: "Which command shows last logins?", options: ["last","who","w","finger"], answer: "last" },
  { id: 49, question: "Which distro uses RPM packages?", options: ["Fedora","Ubuntu","Arch","Gentoo"], answer: "Fedora" },
  { id: 50, question: "Which tool monitors system processes interactively?", options: ["htop","top","ps","taskmgr"], answer: "htop" },
  { id: 51, question: "Which Linux command is used to display the contents of a file?", options: ["cat","show","view","print"], answer: "cat" },
  { id: 52, question: "Which command shows all environment variables?", options: ["env","set","export","printenv"], answer: "env" },
  { id: 53, question: "Which distro is famous for penetration testing and security research?", options: ["Kali Linux","Ubuntu","Debian","Fedora"], answer: "Kali Linux" },
  { id: 54, question: "Which command displays the first lines of a file?", options: ["head","tail","top","less"], answer: "head" },
  { id: 55, question: "Which Linux distro uses the DEB package format?", options: ["Debian","Fedora","Arch","Gentoo"], answer: "Debian" },
  { id: 56, question: "Which command updates packages in Ubuntu/Debian?", options: ["apt update","yum update","pacman -Syu","dnf update"], answer: "apt update" },
  { id: 57, question: "Which command shows the last part of a file?", options: ["tail","head","cat","less"], answer: "tail" },
  { id: 58, question: "Which distro is known for security and anonymity tools?", options: ["Tails","Ubuntu","Arch","Debian"], answer: "Tails" },
  { id: 59, question: "Which command is used to create a new directory?", options: ["mkdir","rmdir","touch","newdir"], answer: "mkdir" },
  { id: 60, question: "Which distro is famous for simplicity and minimalism?", options: ["Arch Linux","Ubuntu","Fedora","OpenSUSE"], answer: "Arch Linux" },
  { id: 61, question: "Which command is used to change the file timestamp?", options: ["touch","chmod","chown","date"], answer: "touch" },
  { id: 62, question: "Which Linux file stores user account information?", options: ["/etc/passwd","/etc/shadow","/etc/group","/etc/users"], answer: "/etc/passwd" },
  { id: 63, question: "Which command shows CPU architecture?", options: ["uname -m","arch","cpuinfo","lscpu"], answer: "uname -m" },
  { id: 64, question: "Which desktop environment is default in Ubuntu?", options: ["GNOME","KDE","XFCE","LXDE"], answer: "GNOME" },
  { id: 65, question: "Which Linux command displays the current path in the terminal?", options: ["pwd","ls","cd","path"], answer: "pwd" },
  { id: 66, question: "Which command is used to compare files?", options: ["diff","cmp","compare","check"], answer: "diff" },
  { id: 67, question: "Which distro is known for rolling updates and bleeding-edge software?", options: ["Arch Linux","Debian","Ubuntu","Red Hat"], answer: "Arch Linux" },
  { id: 68, question: "Which command shows logged-in users?", options: ["who","w","users","id"], answer: "who" },
  { id: 69, question: "Which distro is designed for penetration testers and ethical hackers?", options: ["Parrot OS","Ubuntu","Debian","Fedora"], answer: "Parrot OS" },
  { id: 70, question: "Which command lists all open ports?", options: ["netstat","lsports","ports","ifconfig"], answer: "netstat" },
  { id: 71, question: "Which distro is lightweight and suitable for old hardware?", options: ["Lubuntu","Ubuntu","Kali","Debian"], answer: "Lubuntu" },
  { id: 72, question: "Which command recursively removes a directory?", options: ["rm -r","rmdir","delete -r","del -r"], answer: "rm -r" },
  { id: 73, question: "Which command shows the current running processes?", options: ["top","ps","htop","jobs"], answer: "top" },
  { id: 74, question: "Which command kills a process by PID?", options: ["kill","stop","terminate","end"], answer: "kill" },
  { id: 75, question: "Which command displays the system hostname?", options: ["hostname","uname","host","sysname"], answer: "hostname" },
  { id: 76, question: "Which distro is known for security, privacy, and Tor integration?", options: ["Tails","Ubuntu","Arch","Debian"], answer: "Tails" },
  { id: 77, question: "Which command shows manual pages for commands?", options: ["man","help","guide","doc"], answer: "man" },
  { id: 78, question: "Which command counts lines, words, and characters?", options: ["wc","count","line","stat"], answer: "wc" },
  { id: 79, question: "Which Linux command is used to find files?", options: ["find","search","locate","look"], answer: "find" },
  { id: 80, question: "Which command shows free memory in Linux?", options: ["free","mem","top","vmstat"], answer: "free" },
  { id: 81, question: "Which distro is known for enterprise servers and support?", options: ["Red Hat Enterprise Linux","Ubuntu Desktop","Arch","Gentoo"], answer: "Red Hat Enterprise Linux" },
  { id: 82, question: "Which command shows kernel version?", options: ["uname -r","version","kernel","sysinfo"], answer: "uname -r" },
  { id: 83, question: "Which command changes file permissions numerically?", options: ["chmod 644 file","chown 644 file","chmod ugo file","perm 644 file"], answer: "chmod 644 file" },
  { id: 84, question: "Which command displays disk usage summary?", options: ["df -h","du -h","ls -lh","disk -h"], answer: "df -h" },
  { id: 85, question: "Which distro is based on Red Hat and free to use?", options: ["CentOS","Ubuntu","Debian","Arch"], answer: "CentOS" },
  { id: 86, question: "Which command shows the last lines of a log file in real time?", options: ["tail -f","head -f","cat -f","view -f"], answer: "tail -f" },
  { id: 87, question: "Which command displays block devices?", options: ["lsblk","blklist","df","fdisk"], answer: "lsblk" },
  { id: 88, question: "Which command creates symbolic links?", options: ["ln -s","link","symlink","mklink"], answer: "ln -s" },
  { id: 89, question: "Which distro is famous for simplicity and DIY installation?", options: ["Gentoo","Ubuntu","Fedora","Debian"], answer: "Gentoo" },
  { id: 90, question: "Which command shows open network connections?", options: ["netstat","ifconfig","ping","ip"], answer: "netstat" },
  { id: 91, question: "Which command installs packages in Arch Linux?", options: ["pacman -S","apt install","yum install","dnf install"], answer: "pacman -S" },
  { id: 92, question: "Which command shows all running services?", options: ["systemctl list-units","service --status-all","ps -aux","top"], answer: "systemctl list-units" },
  { id: 93, question: "Which command edits text in the terminal?", options: ["nano","vim","emacs","All of the above"], answer: "All of the above" },
  { id: 94, question: "Which command monitors real-time system resources?", options: ["htop","top","vmstat","glances"], answer: "htop" },
  { id: 95, question: "Which distro is used for multimedia and creative professionals?", options: ["Ubuntu Studio","Fedora","Debian","Arch"], answer: "Ubuntu Studio" },
  { id: 96, question: "Which command shows inode information?", options: ["ls -i","stat","df","du"], answer: "ls -i" },
  { id: 97, question: "Which command shows running kernel modules?", options: ["lsmod","modinfo","insmod","rmmod"], answer: "lsmod" },
  { id: 98, question: "Which distro uses AUR for community packages?", options: ["Arch Linux","Debian","Ubuntu","Fedora"], answer: "Arch Linux" },
  { id: 99, question: "Which command displays CPU info?", options: ["lscpu","cat /proc/cpuinfo","top","htop"], answer: "lscpu" },
  { id: 100, question: "Which Linux command shows logged system messages?", options: ["dmesg","journalctl","syslog","logread"], answer: "dmesg" },
  { id: 101, question: "Which operating system uses a penguin as its mascot?", options: ["Linux","Windows","MacOS","Android"], answer: "Linux" },
  { id: 102, question: "Which command lists files in a directory?", options: ["ls","cd","mkdir","rm"], answer: "ls" },
  { id: 103, question: "Which key combination usually exits a terminal command?", options: ["Ctrl+C","Ctrl+V","Ctrl+X","Ctrl+Z"], answer: "Ctrl+C" },
  { id: 104, question: "Which Linux distro is often recommended for beginners?", options: ["Ubuntu","Arch Linux","Gentoo","Slackware"], answer: "Ubuntu" },
  { id: 105, question: "Which command prints 'Hello World' to the terminal?", options: ["echo 'Hello World'","print 'Hello World'","say 'Hello World'","output 'Hello World'"], answer: "echo 'Hello World'" },
  { id: 106, question: "Which command shows the current working directory?", options: ["pwd","ls","cd","dir"], answer: "pwd" },
  { id: 107, question: "What is Tux?", options: ["Linux mascot","A distro","A command","A file type"], answer: "Linux mascot" },
  { id: 108, question: "Which command changes directories?", options: ["cd","ls","mkdir","rm"], answer: "cd" },
  { id: 109, question: "Which file extension is common for Linux scripts?", options: [".sh",".exe",".bat",".txt"], answer: ".sh" },
  { id: 110, question: "Which command shows the current date and time?", options: ["date","time","now","calendar"], answer: "date" },
  { id: 111, question: "Which is an open source office suite?", options: ["LibreOffice","Microsoft Office","Apple iWork","Google Docs"], answer: "LibreOffice" },
  { id: 112, question: "Which command shows logged-in users?", options: ["who","whoami","users","id"], answer: "who" },
  { id: 113, question: "Which command clears the terminal screen?", options: ["clear","cls","reset","wipe"], answer: "clear" },
  { id: 114, question: "Which command creates an empty file?", options: ["touch filename","create filename","new filename","file filename"], answer: "touch filename" },
  { id: 115, question: "Which command copies files?", options: ["cp","mv","copy","cut"], answer: "cp" },
  { id: 116, question: "Which command removes a file?", options: ["rm","del","erase","delete"], answer: "rm" },
  { id: 117, question: "Which command shows manual pages for a command?", options: ["man","help","info","guide"], answer: "man" },
  { id: 118, question: "Which distro is popular and beginner-friendly?", options: ["Ubuntu","Gentoo","Slackware","Arch"], answer: "Ubuntu" },
  { id: 119, question: "Which desktop environment is common in Linux?", options: ["GNOME","Windows UI","MacOS UI","DOS Shell"], answer: "GNOME" },
  { id: 120, question: "Which command prints your username?", options: ["whoami","id","user","me"], answer: "whoami" },
  { id: 121, question: "Which Linux command shows the current time?", options: ["date","time","clock","now"], answer: "date" },
  { id: 122, question: "Which command makes a new directory?", options: ["mkdir","cd","ls","rm"], answer: "mkdir" },
  { id: 123, question: "Which command shows a file's contents?", options: ["cat","ls","view","show"], answer: "cat" },
  { id: 124, question: "Which distro is known for being easy to install?", options: ["Ubuntu","Gentoo","Arch","Slackware"], answer: "Ubuntu" },
  { id: 125, question: "Which command prints text to the terminal?", options: ["echo","print","say","output"], answer: "echo" },
  { id: 126, question: "Which key combination stops a running command?", options: ["Ctrl+C","Ctrl+V","Ctrl+X","Ctrl+Z"], answer: "Ctrl+C" },
  { id: 127, question: "Which file extension is used for Bash scripts?", options: [".sh",".exe",".bat",".txt"], answer: ".sh" },
  { id: 128, question: "Which command shows logged-in users?", options: ["who","whoami","id","users"], answer: "who" },
  { id: 129, question: "Which command clears the terminal?", options: ["clear","cls","reset","wipe"], answer: "clear" },
  { id: 130, question: "Which command changes directories?", options: ["cd","ls","mkdir","rm"], answer: "cd" },
  { id: 131, question: "Which command copies files?", options: ["cp","mv","cut","copy"], answer: "cp" },
  { id: 132, question: "Which command removes files?", options: ["rm","del","erase","delete"], answer: "rm" },
  { id: 133, question: "Which command shows the current working directory?", options: ["pwd","ls","cd","dir"], answer: "pwd" },
  { id: 134, question: "Which desktop environment is common in Linux?", options: ["GNOME","Windows UI","MacOS UI","DOS Shell"], answer: "GNOME" },
  { id: 135, question: "Which command prints your username?", options: ["whoami","id","user","me"], answer: "whoami" },
  { id: 136, question: "Which open source office suite can you install on Linux?", options: ["LibreOffice","Microsoft Office","iWork","Google Docs"], answer: "LibreOffice" },
  { id: 137, question: "Which command shows the manual for a command?", options: ["man","help","info","guide"], answer: "man" },
  { id: 138, question: "Which Linux mascot is a penguin?", options: ["Tux","Duke","Beastie","Pingu"], answer: "Tux" },
  { id: 139, question: "Which command shows free memory?", options: ["free","top","mem","vmstat"], answer: "free" },
  { id: 140, question: "Which command shows processes?", options: ["ps","top","htop","jobs"], answer: "ps" },
  { id: 141, question: "Which command shows disk space usage?", options: ["df","du","ls","disk"], answer: "df" },
  { id: 142, question: "Which distro is beginner-friendly and popular?", options: ["Ubuntu","Arch","Gentoo","Slackware"], answer: "Ubuntu" },
  { id: 143, question: "Which command shows running kernel modules?", options: ["lsmod","modinfo","insmod","rmmod"], answer: "lsmod" },
  { id: 144, question: "Which command displays CPU info?", options: ["lscpu","cat /proc/cpuinfo","top","htop"], answer: "lscpu" },
  { id: 145, question: "Which command shows logged system messages?", options: ["dmesg","journalctl","syslog","logread"], answer: "dmesg" },
  { id: 146, question: "Which distro uses APT for package management?", options: ["Debian","Arch","Fedora","Gentoo"], answer: "Debian" },
  { id: 147, question: "Which command shows disk usage by folder?", options: ["du","df","ls","disk"], answer: "du" },
  { id: 148, question: "Which command monitors system processes interactively?", options: ["htop","top","ps","taskmgr"], answer: "htop" },
  { id: 149, question: "Which distro is lightweight and suitable for old PCs?", options: ["Lubuntu","Ubuntu","Debian","Arch"], answer: "Lubuntu" },
  { id: 150, question: "Which command shows network interfaces?", options: ["ifconfig","ipconfig","netstat","ping"], answer: "ifconfig" }
];

// --- Quiz State ---
let remainingQuestions = [...zotQuizLinux];
let currentSet = [];
let userAnswers = []; // store {question, correctAnswer, chosenAnswer}

// --- Helpers ---
function shuffleArray(arr) {
    for(let i = arr.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

function getNextSet() {
    if (remainingQuestions.length < 5) {
        remainingQuestions = [...zotQuizLinux]; // reset pool if finished
    }
    shuffleArray(remainingQuestions);
    currentSet = remainingQuestions.splice(0, 5); // take 5 random questions
    // shuffle options for each question
    currentSet.forEach(q => shuffleArray(q.options));
    return currentSet;
}

let zibIndexLinux = 0;
let zibScoreLinux = 0;

// --- Core Functions ---
function zibResetLinux() {
    zibIndexLinux = 0;
    zibScoreLinux = 0;
    userAnswers = [];
    getNextSet();
    zibRenderQuestionLinux();
}

function zibNextLinux(ans) {
    const q = currentSet[zibIndexLinux];
    userAnswers.push({ question: q.question, correctAnswer: q.answer, chosenAnswer: ans });
    if(ans === q.answer) zibScoreLinux++;
    zibIndexLinux++;
    if (zibIndexLinux < currentSet.length){
        zibRenderQuestionLinux();
    } else {
        zibRenderScoreLinux();
    }
}

function zibSkipLinux() {
    const q = currentSet[zibIndexLinux];
    userAnswers.push({ question: q.question, correctAnswer: q.answer, chosenAnswer: null }); // skipped
    zibIndexLinux++;
    if (zibIndexLinux < currentSet.length){
        zibRenderQuestionLinux();
    } else {
        zibRenderScoreLinux();
    }
}

function zibCopyLinux() {
    const t = document.createElement('textarea');
    t.value = `Score: ${zibScoreLinux}/${currentSet.length}`;
    document.body.appendChild(t);
    t.select();
    document.execCommand('copy');
    document.body.removeChild(t);

    const notif = document.getElementById('zib-notif-linux');
    if(notif){
        notif.classList.remove('hidden','opacity-0');
        notif.classList.add('opacity-100');
        setTimeout(()=>{notif.classList.remove('opacity-100'); notif.classList.add('opacity-0');},1500);
    }
}

// --- Render Questions ---
function zibRenderQuestionLinux() {
    const c = document.getElementById('tool-content');
    const q = currentSet[zibIndexLinux];
    c.innerHTML = `
        <div class="mb-4">
            <h3 class="text-lg font-bold text-indigo-400 mb-2">Q${zibIndexLinux+1}/${currentSet.length} (ID: ${q.id})</h3>
            <p class="text-gray-200">${q.question}</p>
        </div>
        <div class="grid grid-cols-1 gap-3 mb-4">
            ${q.options.map(o=>`<button onclick="zibNextLinux('${o}')" class="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg shadow-md">${o}</button>`).join('')}
        </div>
        <div class="flex justify-between mt-2">
            <button onclick="zibSkipLinux()" class="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg">Skip</button>
            <button onclick="zibResetLinux()" class="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg">Restart</button>
        </div>
    `;
}

// --- Render Results ---
function zibRenderScoreLinux() {
    const c = document.getElementById('tool-content');
    c.innerHTML = `
        <div class="text-center">
            <h3 class="text-2xl font-bold text-green-400 mb-4">Quiz Done!</h3>
            <p class="text-gray-200 mb-6">Score: <span class="font-mono">${zibScoreLinux}/${currentSet.length}</span></p>
            ${userAnswers.map((ua, idx) => {
                let html = `<div class="mb-4 text-left p-3 border-b border-gray-700 rounded-lg bg-gray-800">
                    <p class="font-bold text-indigo-400 mb-2">Q${idx+1}: ${ua.question}</p>`;
                if(ua.chosenAnswer === ua.correctAnswer){
                    html += `<p class="text-green-500 font-semibold">✔ ${ua.correctAnswer}</p>`;
                } else {
                    if(ua.chosenAnswer !== null){
                        html += `<p class="text-red-500 font-semibold">✖ ${ua.chosenAnswer}</p>`;
                    }
                    html += `<p class="text-green-500 font-semibold">✔ ${ua.correctAnswer}</p>`;
                }
                html += `</div>`;
                return html;
            }).join('')}
            <button onclick="zibResetLinux()" class="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg mt-3 mb-3">Next Set</button>
            <button onclick="zibCopyLinux()" class="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg mt-3">Copy Score</button>
            <div id="zib-notif-linux" class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white text-xs px-3 py-1 rounded-full opacity-0 hidden transition-opacity duration-300 pointer-events-none">Copied!</div>
        </div>
    `;
}

// --- Entry Point ---
function renderFastquiz() {
    resetToolContent('Linux Trivia', 'Test your Linux, GNU, and Open Source knowledge!');
    zibResetLinux();
}

