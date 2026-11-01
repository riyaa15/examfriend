import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  Download,
  Printer,
  Copy,
  Check,
  Search,
  Filter,
  Trash2,
  BookOpen,
  HelpCircle,
  Award,
  Layers,
  ArrowRight,
  Eye,
  EyeOff,
  Image as ImageIcon,
  FileCode,
  Tag,
  PenTool,
  Bookmark,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  Palette
} from 'lucide-react';

// ================= DEMO PRESET 1: NLP LEVELS (EXACT SCREENSHOT REFERENCE) =================
export const DEMO_NLP_NOTE = {
  id: 'demo-nlp-page18',
  question_number: '7.',
  question_title: 'Explain the Levels/Tasks of NLP.',
  topic: 'Levels/Tasks of NLP',
  subject_name: 'Natural Language Processing (SEM7)',
  source_filename: 'nlp1.pdf (Page 18 Reference Notes)',
  tagline: 'Handwritten Revision Note & Master Multi-Mark Q&A Pack',
  doodle_left: '⭐',
  doodle_right: '📖✨',
  created_at: new Date().toISOString(),
  introduction: 'NLP performs a number of tasks in a sequence. These tasks are arranged in different levels. Output of one level becomes the input for the next level.',
  hierarchy: [
    { level_num: 5, name: '5. Pragmatic Level', description: 'Understanding the intended meaning in context', color: '#e0f2fe', borderColor: '#7dd3fc' },
    { level_num: 4, name: '4. Discourse Level', description: 'Understanding connection between sentences', color: '#dcfce7', borderColor: '#86efac' },
    { level_num: 3, name: '3. Semantic Level', description: 'Understanding meaning of words, phrases, sentences', color: '#fef9c3', borderColor: '#fde047' },
    { level_num: 2, name: '2. Syntactic Level', description: 'Understanding grammatical structure of sentences', color: '#ffedd5', borderColor: '#fdba74' },
    { level_num: 1, name: '1. Lexical / Morphological Level', description: 'Analyzing structure of words and formation', color: '#f3e8ff', borderColor: '#d8b4fe' }
  ],
  tasks_table: [
    {
      level: '1. Lexical / Morphological Level',
      goal: 'Analyze the structure of words and identify base forms.',
      main_tasks: [
        'Tokenization',
        'Word formation analysis',
        'Stemming / Lemmatization',
        'Part of Speech (POS) tagging'
      ],
      example_input: '"He is playing football"',
      example_output: '[He/PRP] [is/VBZ] [play/VBG] [football/NN]'
    },
    {
      level: '2. Syntactic Level',
      goal: 'Analyze the grammatical structure of words in a sentence.',
      main_tasks: [
        'Parsing',
        'Chunking',
        'Identifying phrase structure',
        'Checking grammatical relations'
      ],
      example_input: '"The boy is playing football"',
      example_output: '(S (NP (Det The) (N boy)) (VP (V is) (VP (VBG playing) (NP (N football)))))'
    },
    {
      level: '3. Semantic Level',
      goal: 'Determine the meaning of words, phrases and sentences.',
      main_tasks: [
        'Word sense disambiguation',
        'Semantic role labeling',
        'Named entity recognition',
        'Logical form representation'
      ],
      example_input: '"I saw the man with a telescope"',
      example_output: 'Identify meaning => "saw" as past tense verb, man (person), telescope (instrument)'
    },
    {
      level: '4. Discourse Level',
      goal: 'Understand the connection and coherence between sentences.',
      main_tasks: [
        'Coreference resolution',
        'Discourse relation identification',
        'Coherence / Cohesion analysis',
        'Topic tracking'
      ],
      example_input: '"Riya went to the market. She bought fruits."',
      example_output: '"She" refers to "Riya". Relation => continuation'
    },
    {
      level: '5. Pragmatic Level',
      goal: 'Understand the intended meaning in real world context.',
      main_tasks: [
        'Speaker intention recognition',
        'Implicature resolution',
        'Use of world knowledge',
        'Handling ambiguity in context'
      ],
      example_input: '"Can you pass the salt?"',
      example_output: 'Intended meaning => Request, not ability question. (Context based understanding)'
    }
  ],
  pipeline: [
    { step: 'Raw Text / Speech', color: '#f1f5f9', borderColor: '#94a3b8' },
    { step: 'Lexical / Morphological Analysis', color: '#f3e8ff', borderColor: '#c084fc' },
    { step: 'Syntactic Analysis', color: '#ffedd5', borderColor: '#fb923c' },
    { step: 'Semantic Analysis', color: '#fef9c3', borderColor: '#facc15' },
    { step: 'Discourse Analysis', color: '#dcfce7', borderColor: '#4ade80' },
    { step: 'Pragmatic Analysis', color: '#e0f2fe', borderColor: '#38bdf8' },
    { step: 'Meaningful Response / Action', color: '#fce7f3', borderColor: '#f472b6' }
  ],
  pipeline_caption: 'Output of one level is input to the next level',
  key_points: [
    'NLP starts from lower level (word level) and moves to higher level (context & intention).',
    'Higher levels require the results of lower levels.',
    'All levels together help in complete understanding and generation of natural language.'
  ],
  end_to_end_example: {
    input_sentence: '"Yesterday, John gave Mary a book."',
    steps: [
      { stage: '1. Lexical', desc: 'Identify tokens and POS.' },
      { stage: '2. Syntactic', desc: 'Parse the sentence structure.' },
      { stage: '3. Semantic', desc: 'Identify who gave what to whom.' },
      { stage: '4. Discourse', desc: 'Link with previous/following sentences.' },
      { stage: '5. Pragmatic', desc: 'Understand the intention in context.' }
    ]
  },
  definitions_and_formulas: [
    {
      term: 'Morpheme vs Token',
      formula_or_rule: 'Word = Stem + Affix (Prefix/Suffix)',
      explanation: 'Tokens are word units; morphemes are the smallest semantic grammatical units.',
      highlight_color: 'yellow'
    },
    {
      term: 'Parse Tree Invariant',
      formula_or_rule: 'S -> NP VP',
      explanation: 'Context-free grammar rules governing valid grammatical sentence formation.',
      highlight_color: 'cyan'
    },
    {
      term: 'Pragmatic Implicature',
      formula_or_rule: 'Meaning = Literal_Text + Context + World_Knowledge',
      explanation: 'Deciphers what the speaker really intends beyond literal vocabulary.',
      highlight_color: 'pink'
    }
  ],
  questions_and_answers: [
    {
      id: 1,
      marks: 2,
      question_type: 'Short Concept',
      question: 'What is the difference between Stemming and Lemmatization in Lexical Analysis?',
      answer_bullets: [
        'Stemming: Crude heuristic chopping of word endings (e.g. "caring" -> "car").',
        'Lemmatization: Uses vocabulary and morphological analysis to return actual base dictionary lemma (e.g. "caring" -> "care").'
      ],
      model_answer: 'Stemming strips word affixes using algorithmic rules often producing non-words, whereas Lemmatization uses morphological lookup to return the canonical base form (lemma).',
      key_exam_tip: 'Give an example for both words to secure 2/2 marks.',
      importance: '⭐⭐⭐ V.IMP'
    },
    {
      id: 2,
      marks: 5,
      question_type: 'Working Principle',
      question: 'Explain the role of Discourse and Pragmatic analysis in resolving real-world conversational ambiguity.',
      answer_bullets: [
        'Discourse Analysis: Resolves coreference across multiple sentences.',
        'Pragmatic Analysis: Applies world knowledge and user intention to decode indirect speech.',
        'Example: Distinguishing "Can you open the door?" as a polite request rather than a query of physical capability.'
      ],
      model_answer: 'Discourse analysis connects entities across consecutive sentences through coreference resolution. Pragmatic analysis goes a step further by interpreting speaker intention using real-world context, turning literal statements into intended functional commands.',
      key_exam_tip: 'Always mention Grice\'s Maxims or Speech Act theory if asked in 5-mark university papers.',
      importance: '⭐⭐ Frequent'
    },
    {
      id: 3,
      marks: 10,
      question_type: 'Architecture & Hierarchy',
      question: 'With a neat architectural hierarchy and pipeline diagram, explain all 5 Levels of Natural Language Processing with concrete examples.',
      answer_bullets: [
        'Part 1: Vertical Hierarchy Stack diagram with arrows (Lexical -> Syntactic -> Semantic -> Discourse -> Pragmatic).',
        'Part 2: 4-Column Description Table explaining Goal, Tasks, Input, and Output for all 5 levels.',
        'Part 3: Horizontal Pipeline flowchart and End-to-End sentence walkthrough.'
      ],
      model_answer: 'Natural Language Processing comprises five interconnected hierarchical phases: Lexical/Morphological (word structure), Syntactic (grammar trees), Semantic (literal meaning), Discourse (multi-sentence coherence), and Pragmatic (contextual intent). Each phase builds directly upon the output of the preceding layer to transform raw text into meaningful understanding.',
      key_exam_tip: 'Draw both the stack hierarchy and the pipeline flowchart to score full 10/10 marks.',
      importance: '⭐⭐⭐ V.IMP'
    }
  ],
  mnemonics_and_tricks: [
    'L-S-S-D-P Mnemonic: "Little Students See Deep Poetry" (Lexical -> Syntactic -> Semantic -> Discourse -> Pragmatic)',
    'Golden Rule: Lower levels deal with words; Higher levels deal with context and human intent.'
  ],
  margin_notes: [
    '⭐ V.IMP: 10-mark question appears in almost every Semester NLP Paper!',
    '💡 Examiner Secret: Drawing the 5-layer colored hierarchy stack guarantees 5 marks upfront!'
  ]
};

// ================= DEMO PRESET 2: OPERATING SYSTEMS (PAGING & VIRTUAL MEMORY) =================
export const DEMO_OS_NOTE = {
  id: 'demo-os-paging',
  question_number: '4.',
  question_title: 'Explain the Working, Hierarchy & Address Translation in Paging.',
  topic: 'Paging & Virtual Memory',
  subject_name: 'Operating Systems (CSE302)',
  source_filename: 'OS_Virtual_Memory_Lecture.pdf',
  tagline: 'Handwritten Revision Note & Master Multi-Mark Q&A Pack',
  doodle_left: '⭐',
  doodle_right: '📖✨',
  created_at: new Date().toISOString(),
  introduction: 'Paging is a memory management scheme that eliminates the need for contiguous physical memory allocation. The operating system breaks virtual address space into fixed-size pages and maps them to physical frames via page tables.',
  hierarchy: [
    { level_num: 5, name: '5. Process Address Space', description: 'Logical virtual address generated by CPU (Page # + Offset)', color: '#e0f2fe', borderColor: '#38bdf8' },
    { level_num: 4, name: '4. Translation Lookaside Buffer', description: 'High-speed associative hardware cache for fast address translation', color: '#dcfce7', borderColor: '#4ade80' },
    { level_num: 3, name: '3. Multi-Level Page Table', description: 'Directory mapping virtual page numbers to physical frame numbers', color: '#fef9c3', borderColor: '#facc15' },
    { level_num: 2, name: '2. Page Fault Trap Handler', description: 'Kernel interrupt handling swapping missing pages from secondary disk', color: '#ffedd5', borderColor: '#fb923c' },
    { level_num: 1, name: '1. Physical RAM & Swap Space', description: 'Physical DRAM memory frames and disk swap partition', color: '#f3e8ff', borderColor: '#c084fc' }
  ],
  tasks_table: [
    {
      level: '1. Address Splitting Level',
      goal: 'Decompose CPU logical address into Page Number and Offset.',
      main_tasks: ['Address bus decoding', 'Extract Page Number (p)', 'Extract Offset (d)', 'Bounds verification'],
      example_input: 'CPU instruction: LOAD 0x7FFF8020',
      example_output: 'p = 0x7FFF8 (Page #524280), d = 0x020 (Offset 32)'
    },
    {
      level: '2. TLB Cache Lookup Level',
      goal: 'Perform parallel associative search in TLB hardware cache.',
      main_tasks: ['TLB tag matching', 'Hit/Miss detection', 'Cache line replacement', 'Protection bit verification'],
      example_input: 'Page Number: 0x7FFF8',
      example_output: 'TLB Hit => Frame #14 (Memory access in ~1ns)'
    },
    {
      level: '3. Page Table Walk Level',
      goal: 'Resolve physical frame from multi-level page table on TLB miss.',
      main_tasks: ['Page Directory lookup', 'Inner Page Table indexing', 'Valid/Invalid bit inspection', 'Update TLB entry'],
      example_input: 'TLB Miss for Page 0x7FFF8',
      example_output: 'Page Table Entry: Frame #14, Valid=1, Dirty=0'
    },
    {
      level: '4. Page Fault Handling Level',
      goal: 'Bring missing page from secondary disk swap into physical RAM.',
      main_tasks: ['Kernel trap interrupt', 'Select victim frame (LRU/FIFO)', 'Disk swap-in I/O', 'Update page table bits'],
      example_input: 'Valid Bit = 0 (Page not resident in RAM)',
      example_output: 'Page Fault Service Routine completed; page restored to RAM'
    },
    {
      level: '5. Physical Access Level',
      goal: 'Synthesize physical address and access requested DRAM word.',
      main_tasks: ['Concatenate Frame # and Offset', 'Memory bus drive', 'Cache line fill', 'Return word to CPU'],
      example_input: 'Frame #14 + Offset 0x020',
      example_output: 'Physical Address: 0x000E0020 (Operand returned to CPU)'
    }
  ],
  pipeline: [
    { step: 'CPU Virtual Address', color: '#f1f5f9', borderColor: '#94a3b8' },
    { step: 'TLB Cache Search', color: '#f3e8ff', borderColor: '#c084fc' },
    { step: 'Page Table Walk', color: '#ffedd5', borderColor: '#fb923c' },
    { step: 'Page Fault Trap', color: '#fef9c3', borderColor: '#facc15' },
    { step: 'Frame Synthesis', color: '#dcfce7', borderColor: '#4ade80' },
    { step: 'Physical RAM Access', color: '#e0f2fe', borderColor: '#38bdf8' }
  ],
  pipeline_caption: 'Virtual Page Number translates to Physical Frame Number at hardware speed',
  key_points: [
    'Paging completely eliminates external fragmentation by utilizing fixed-size memory blocks (typically 4 KB).',
    'Translation Lookaside Buffer (TLB) achieves >98% hit ratios, reducing average memory access time to near-DRAM latency.',
    'Page faults invoke high-overhead disk I/O; page replacement algorithms (LRU, FIFO, Clock) aim to minimize fault rates.'
  ],
  end_to_end_example: {
    input_sentence: 'CPU executes: MOV EAX, [0x00403010] (Virtual Address)',
    steps: [
      { stage: '1. Split', desc: 'Virtual Page = 0x00403, Offset = 0x010.' },
      { stage: '2. TLB Check', desc: 'TLB searched in parallel; returns Frame #0x0002A.' },
      { stage: '3. Translate', desc: 'Physical Address = (0x0002A * 4096) + 0x010 = 0x0002A010.' },
      { stage: '4. Verify', desc: 'Check Read/Write and User/Supervisor permission bits.' },
      { stage: '5. Access', desc: 'Physical DRAM word fetched and loaded into EAX register.' }
    ]
  },
  definitions_and_formulas: [
    {
      term: 'Effective Memory Access Time (EMAT)',
      formula_or_rule: 'EMAT = h * (t_tlb + t_ram) + (1 - h) * (t_tlb + 2 * t_ram)',
      explanation: 'Calculates average memory latency where h is the TLB hit ratio.',
      highlight_color: 'yellow'
    },
    {
      term: 'Address Translation Invariant',
      formula_or_rule: 'Physical_Address = (Frame_Number * Page_Size) + Offset',
      explanation: 'The fundamental mathematical mapping between logical pages and physical frames.',
      highlight_color: 'cyan'
    }
  ],
  questions_and_answers: [
    {
      id: 1,
      marks: 2,
      question_type: 'Short Concept',
      question: 'What is the primary difference between Paging and Segmentation in Operating Systems?',
      answer_bullets: [
        'Paging divides memory into fixed-size physical blocks (pages/frames); transparent to programmer; eliminates external fragmentation.',
        'Segmentation divides memory into variable-sized logical units (code, stack, heap); visible to programmer; can cause external fragmentation.'
      ],
      model_answer: 'Paging is a hardware-driven mechanism with fixed-size pages eliminating external fragmentation, whereas segmentation divides memory into variable-size programmer-defined logical segments.',
      key_exam_tip: 'Draw the 2-column comparison table to secure 2/2 marks.',
      importance: '⭐⭐⭐ V.IMP'
    },
    {
      id: 2,
      marks: 5,
      question_type: 'Working Principle',
      question: 'Explain the step-by-step sequence of events that occur when a Page Fault occurs.',
      answer_bullets: [
        '1. Hardware detects invalid bit in page table entry and triggers a software trap to kernel.',
        '2. OS saves user process context and verifies valid memory access range.',
        '3. OS locates page on secondary swap disk and finds a free physical frame (running page replacement if full).',
        '4. Disk controller reads page into allocated physical frame via DMA.',
        '5. OS updates page table entry valid bit, updates TLB, and restarts interrupted instruction.'
      ],
      model_answer: 'A page fault initiates when an instruction accesses a non-resident page. The CPU traps to the OS kernel, which saves process state, allocates a physical frame (invoking replacement algorithms like LRU if needed), executes disk swap-in, marks the page table valid, and restarts the faulting instruction.',
      key_exam_tip: 'Highlight that the interrupted instruction must be restarted from the beginning.',
      importance: '⭐⭐ Frequent'
    },
    {
      id: 3,
      marks: 10,
      question_type: 'Architecture & Hierarchy',
      question: 'With a neat architectural hierarchy and hardware translation diagram, explain Paging with TLB in detail.',
      answer_bullets: [
        'Part 1: 5-Tier Memory Hierarchy Stack with arrows (CPU Virtual Address -> TLB -> Page Directory -> Physical RAM).',
        'Part 2: 4-Column Description Table explaining Address Splitting, TLB Lookup, Page Table Walk, and Page Faults.',
        'Part 3: Complete EMAT formula derivation and End-to-End address translation numerical.'
      ],
      model_answer: 'Paging with a Translation Lookaside Buffer (TLB) bridges virtual memory abstractions with physical DRAM. The CPU splits addresses into page numbers and offsets. High-speed TLB caches resolve physical frames in ~1ns. On miss, multi-level page tables walk the directory. If the page is unmapped, a page fault brings the frame from disk.',
      key_exam_tip: 'Always write the EMAT numerical formula and sketch the address translation diagram in pencil.',
      importance: '⭐⭐⭐ V.IMP'
    }
  ],
  mnemonics_and_tricks: [
    'P-O-F-O Rule: Page + Offset translates to Frame + Offset (Offset never changes!)',
    'Remember: Page size is ALWAYS a power of 2 (2^n bytes) so offset bits directly map without arithmetic division.'
  ],
  margin_notes: [
    '⭐ V.IMP: 10-mark question appears in almost every Semester Operating Systems Paper!',
    '💡 Examiner Secret: Mentioning multi-level page tables (x86-64 4-level PML4) earns bonus marks!'
  ]
};

// ================= DEMO PRESET 3: COMPUTER NETWORKS (7-LAYER OSI MODEL) =================
export const DEMO_NETWORKS_NOTE = {
  id: 'demo-networks-osi',
  question_number: '2.',
  question_title: 'Explain the 7 Layers of the OSI Reference Model & Data Encapsulation.',
  topic: '7-Layer OSI Model',
  subject_name: 'Computer Networks (CSE304)',
  source_filename: 'Networks_OSI_Reference.pdf',
  tagline: 'Handwritten Revision Note & Master Multi-Mark Q&A Pack',
  doodle_left: '⭐',
  doodle_right: '📖✨',
  created_at: new Date().toISOString(),
  introduction: 'The Open Systems Interconnection (OSI) model partitions telecommunications into seven distinct abstraction layers. Data flows down from the application layer to the physical cable, undergoing encapsulation at each tier.',
  hierarchy: [
    { level_num: 7, name: '7. Application Layer', description: 'Direct user network interfaces (HTTP, DNS, SMTP, SSH)', color: '#e0f2fe', borderColor: '#38bdf8' },
    { level_num: 6, name: '6. Presentation & Session', description: 'Data formatting, SSL/TLS encryption, and dialog checkpoints', color: '#dcfce7', borderColor: '#4ade80' },
    { level_num: 4, name: '4. Transport Layer', description: 'End-to-end reliability, segmenting, and port multiplexing (TCP/UDP)', color: '#fef9c3', borderColor: '#facc15' },
    { level_num: 3, name: '3. Network Layer', description: 'Logical routing, IP packet forwarding, and subnet addressing', color: '#ffedd5', borderColor: '#fb923c' },
    { level_num: 1, name: '1. Data Link & Physical', description: 'MAC framing, error detection (CRC), and raw bit signaling', color: '#f3e8ff', borderColor: '#c084fc' }
  ],
  tasks_table: [
    {
      level: '1. Physical & Data Link Layer',
      goal: 'Transmit raw bits across transmission medium and ensure node-to-node frame delivery.',
      main_tasks: ['Voltage encoding', 'MAC addressing', 'Frame delimitation', 'CRC-32 error detection'],
      example_input: 'Frame: Destination MAC: 00:1A:2B:3C:4D:5E',
      example_output: 'Bit stream modulated onto Ethernet cable / Wi-Fi RF carrier'
    },
    {
      level: '2. Network Layer (IP)',
      goal: 'Route packets host-to-host across disparate heterogeneous networks.',
      main_tasks: ['Logical IP addressing', 'Dijkstra / BGP routing', 'Packet fragmentation', 'TTL decrementing'],
      example_input: 'IP Packet: Src: 192.168.1.10 -> Dst: 142.250.190.46',
      example_output: 'Next-hop router interface chosen via forwarding routing table'
    },
    {
      level: '3. Transport Layer (TCP/UDP)',
      goal: 'Provide process-to-process delivery, flow control, and connection management.',
      main_tasks: ['Port number multiplexing', '3-Way TCP Handshake', 'Sliding window flow control', 'Congestion avoidance'],
      example_input: 'TCP Segment: SYN=1, Seq=1000, Port=443',
      example_output: 'Reliable socket connection established with selective ACK'
    },
    {
      level: '4. Session & Presentation Layer',
      goal: 'Control communication dialogs and translate data representation.',
      main_tasks: ['TLS 1.3 cryptographic handshake', 'MIME character encoding', 'Data compression (gzip)', 'Session token management'],
      example_input: 'Encrypted ciphertext over TLS socket',
      example_output: 'Decrypted plain JSON/HTML string ready for application layer'
    },
    {
      level: '5. Application Layer',
      goal: 'Deliver direct human-facing software services and network APIs.',
      main_tasks: ['HTTP/2 request handling', 'DNS name resolution', 'Authentication headers', 'Payload rendering'],
      example_input: 'GET /api/v1/students HTTP/2.0',
      example_output: 'HTTP 200 OK Response with JSON payload dispatched'
    }
  ],
  pipeline: [
    { step: 'Application Data', color: '#f1f5f9', borderColor: '#94a3b8' },
    { step: 'TCP Segments (L4)', color: '#f3e8ff', borderColor: '#c084fc' },
    { step: 'IP Packets (L3)', color: '#ffedd5', borderColor: '#fb923c' },
    { step: 'MAC Frames (L2)', color: '#fef9c3', borderColor: '#facc15' },
    { step: 'Raw Physical Bits (L1)', color: '#dcfce7', borderColor: '#4ade80' },
    { step: 'Transmission Medium', color: '#e0f2fe', borderColor: '#38bdf8' }
  ],
  pipeline_caption: 'Data encapsulates down the stack with headers; decapsulates up at receiver',
  key_points: [
    'Each layer adds its own Protocol Data Unit (PDU) header (Data -> Segment -> Packet -> Frame -> Bits).',
    'Layer independence allows updating physical fiber/Wi-Fi standards without changing web applications.',
    'Routers operate up to Layer 3 (Network); Switches operate at Layer 2 (Data Link); End hosts process all 7 layers.'
  ],
  end_to_end_example: {
    input_sentence: 'Client browser accesses: https://examfriend.edu/login',
    steps: [
      { stage: '1. App', desc: 'Browser crafts HTTPS GET request.' },
      { stage: '2. Transport', desc: 'TCP adds Source Port 54120 and Destination Port 443.' },
      { stage: '3. Network', desc: 'IP header adds Source IP and Destination Gateway IP.' },
      { stage: '4. Data Link', desc: 'Ethernet header adds Router MAC address and CRC trailer.' },
      { stage: '5. Physical', desc: 'NIC converts frame into optical light pulses across fiber.' }
    ]
  },
  definitions_and_formulas: [
    {
      term: 'Bandwidth-Delay Product (BDP)',
      formula_or_rule: 'BDP = Bandwidth (bps) * Round_Trip_Time (seconds)',
      explanation: 'Determines the maximum amount of in-flight data allowed in the TCP sliding window.',
      highlight_color: 'yellow'
    },
    {
      term: 'Encapsulation Invariant',
      formula_or_rule: 'Total_Frame_Size = Payload + TCP_Hdr + IP_Hdr + MAC_Hdr + CRC_Trailer',
      explanation: 'Every abstraction layer adds protocol overhead bytes to enforce delivery invariants.',
      highlight_color: 'cyan'
    }
  ],
  questions_and_answers: [
    {
      id: 1,
      marks: 2,
      question_type: 'Short Concept',
      question: 'What is the key difference between TCP and UDP at the Transport Layer?',
      answer_bullets: [
        'TCP: Connection-oriented, reliable, guarantees in-order delivery via sequence numbers and ACKs, flow/congestion control.',
        'UDP: Connectionless, unreliable best-effort, lightweight with zero connection setup delay (ideal for streaming & DNS).'
      ],
      model_answer: 'TCP guarantees reliable, ordered byte streams with flow control through three-way handshaking, whereas UDP is connectionless with minimal header overhead and lower latency.',
      key_exam_tip: 'Mention that TCP uses 20-byte headers while UDP uses 8-byte headers.',
      importance: '⭐⭐⭐ V.IMP'
    },
    {
      id: 2,
      marks: 5,
      question_type: 'Working Principle',
      question: 'Explain the 3-Way Handshake mechanism in TCP connection establishment.',
      answer_bullets: [
        'Step 1 (SYN): Client sends SYN packet with an initial sequence number (ISN_c) to server port.',
        'Step 2 (SYN-ACK): Server responds with SYN-ACK, acknowledging ISN_c + 1 and sending its own sequence number ISN_s.',
        'Step 3 (ACK): Client replies with ACK packet acknowledging ISN_s + 1. Connection moves to ESTABLISHED state.'
      ],
      model_answer: 'TCP ensures synchronized communication using a 3-way handshake: Client transmits SYN; Server accepts and replies with SYN+ACK; Client acknowledges with ACK. This negotiates sequence numbers and socket buffers before data transfer.',
      key_exam_tip: 'Draw the two vertical timeline arrows (Client <-> Server) showing SYN, SYN+ACK, ACK.',
      importance: '⭐⭐⭐ V.IMP'
    },
    {
      id: 3,
      marks: 10,
      question_type: 'Architecture & Hierarchy',
      question: 'With a neat vertical hierarchy stack and encapsulation pipeline, explain the 7 Layers of the OSI Model in detail.',
      answer_bullets: [
        'Part 1: 7-Layer Vertical Stack diagram with upward arrows and functions.',
        'Part 2: 4-Column Description Table explaining Layer Name, Protocol Goal, Main Tasks, and Concrete Packet Examples.',
        'Part 3: End-to-End Web Request walkthrough tracing Data to Bits.'
      ],
      model_answer: 'The OSI Model structures networking into Physical, Data Link, Network, Transport, Session, Presentation, and Application layers. Each layer isolates lower-level communication details, passing PDUs downward through encapsulation and upward through decapsulation.',
      key_exam_tip: 'Use the famous mnemonic "All People Seem To Need Data Processing" to avoid missing any layer.',
      importance: '⭐⭐⭐ V.IMP'
    }
  ],
  mnemonics_and_tricks: [
    'OSI Layer Mnemonic (Top to Bottom): "All People Seem To Need Data Processing" (Application -> Presentation -> Session -> Transport -> Network -> Data Link -> Physical)',
    'Data Unit Mnemonic: "Don\'t Some People Fear Bears?" (Data -> Segment -> Packet -> Frame -> Bits)'
  ],
  margin_notes: [
    '⭐ V.IMP: 10-mark question appears in almost every Semester Computer Networks Paper!',
    '💡 Examiner Secret: Writing the exact PDU names (Bits, Frames, Packets, Segments) ensures top scores!'
  ]
};

export default function Card8NotesMaker({ token, onBack, onNavigate, onRefresh }) {
  // Input states
  const [topic, setTopic] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [file, setFile] = useState(null);
  const [rawNotes, setRawNotes] = useState('');
  const [showRawInput, setShowRawInput] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Generation & display states (Default initialized to DEMO_NLP_NOTE matching screenshot)
  const [generating, setGenerating] = useState(false);
  const [currentNote, setCurrentNote] = useState(DEMO_NLP_NOTE);
  const [savedNotes, setSavedNotes] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [notification, setNotification] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Notebook styling & interactive states
  const [paperStyle, setPaperStyle] = useState('plain'); // 'plain', 'ruled', 'grid', 'yellow'
  const [inkColor, setInkColor] = useState('#1e1b4b'); // deep rich ink
  const [fontFamily, setFontFamily] = useState('font-patrick'); // Patrick Hand (neat handwriting matching screenshot)
  const [activeTab, setActiveTab] = useState('notebook'); // 'notebook', 'qa-bank', 'library'
  const [marksFilter, setMarksFilter] = useState('all'); // 'all', '2', '5', '10'
  const [searchQuery, setSearchQuery] = useState('');
  const [revealedAnswers, setRevealedAnswers] = useState({}); // for self-test accordion
  const [selfTestMode, setSelfTestMode] = useState(false);

  const fileInputRef = useRef(null);

  // Fetch past generated notes for this user
  const fetchNotes = async () => {
    if (!token) return;
    setLoadingSaved(true);
    try {
      const res = await fetch('/api/handwritten-notes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSavedNotes(data);
        if (data.length > 0 && !currentNote) {
          setCurrentNote(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    } finally {
      setLoadingSaved(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [token]);

  // Handle file select (PDF or Photo)
  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      // If photo, generate thumbnail preview
      const lower = selected.name.toLowerCase();
      if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp')) {
        const url = URL.createObjectURL(selected);
        setPreviewImage(url);
      } else {
        setPreviewImage(null);
      }
    }
  };

  // 1-Click Load Screenshot NLP Demo Notes
  const handleLoadScreenshotDemo = () => {
    setCurrentNote(DEMO_NLP_NOTE);
    setTopic('Explain the Levels/Tasks of NLP.');
    setSubjectName('Natural Language Processing (SEM7)');
    setActiveTab('notebook');
    setFontFamily('font-patrick');
    setPaperStyle('plain');
    setInkColor('#1e1b4b');
    setNotification('⭐ Loaded NLP Reference Note in topper screenshot layout!');
    setTimeout(() => setNotification(''), 4000);
  };

  // 1-Click Load Operating Systems Paging Demo
  const handleLoadOSDemo = () => {
    setCurrentNote(DEMO_OS_NOTE);
    setTopic('Explain the Working, Hierarchy & Address Translation in Paging.');
    setSubjectName('Operating Systems (CSE302)');
    setActiveTab('notebook');
    setFontFamily('font-patrick');
    setPaperStyle('plain');
    setInkColor('#1e1b4b');
    setNotification('💻 Loaded Operating Systems: Paging & Virtual Memory in topper screenshot layout!');
    setTimeout(() => setNotification(''), 4000);
  };

  // 1-Click Load Networks Demo
  const handleLoadNetworksDemo = () => {
    setCurrentNote(DEMO_NETWORKS_NOTE);
    setTopic('Explain the 7 Layers of the OSI Reference Model & Data Encapsulation.');
    setSubjectName('Computer Networks (CSE304)');
    setActiveTab('notebook');
    setFontFamily('font-patrick');
    setPaperStyle('plain');
    setInkColor('#1e1b4b');
    setNotification('🌐 Loaded Computer Networks: 7-Layer OSI Model in topper screenshot layout!');
    setTimeout(() => setNotification(''), 4000);
  };

  // Generate Handwritten Notes
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Please provide a Topic Name (e.g. "Operating Systems - Virtual Memory", "Physics - Thermodynamics", or "Levels/Tasks of NLP").');
      return;
    }

    setGenerating(true);
    setError('');
    setNotification('');

    try {
      const formData = new FormData();
      formData.append('topic', topic.trim());
      formData.append('subject_name', subjectName.trim() || 'General');
      if (rawNotes.trim()) {
        formData.append('raw_notes', rawNotes.trim());
      }
      if (file) {
        formData.append('file', file);
      }

      const res = await fetch('/api/handwritten-notes/generate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to generate handwritten notes.');
      }

      const noteData = await res.json();
      setCurrentNote(noteData);
      setActiveTab('notebook');
      setFontFamily('font-patrick');
      setNotification(`🎉 Handwritten Revision Sheet & ${noteData.questions_and_answers?.length || 0} Q&As Generated Successfully for "${noteData.topic}"!`);
      fetchNotes();
      if (onRefresh) onRefresh();

      // Clean up input file preview
      setFile(null);
      setPreviewImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error occurred while generating notes.');
    } finally {
      setGenerating(false);
    }
  };

  // Soft-delete to Card 9: Trash
  const handleDeleteNote = async (noteId) => {
    if (String(noteId).startsWith('demo-')) {
      setCurrentNote(null);
      setNotification('Demo note dismissed.');
      return;
    }
    if (!window.confirm('Move this handwritten note to Card 9: Trash? You can restore it anytime.')) {
      return;
    }
    try {
      const res = await fetch(`/api/handwritten-notes/${noteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotification('Moved to Card 9: Trash.');
        if (currentNote?.id === noteId || currentNote?.note_id === noteId) {
          setCurrentNote(null);
        }
        fetchNotes();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
      setError('Failed to delete note.');
    }
  };

  // Toggle reveal for Q&A in Self-Test Mode
  const toggleAnswer = (qId) => {
    setRevealedAnswers(prev => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  // Copy Markdown of Notes & Q&As
  const handleCopyNotes = () => {
    if (!currentNote) return;
    const qList = currentNote.questions_and_answers || [];
    const dList = currentNote.definitions_and_formulas || [];

    let text = `# ${currentNote.question_number || '1.'} ${currentNote.question_title || currentNote.topic}\n\n`;
    text += `## 1) INTRODUCTION\n${currentNote.introduction || currentNote.core_summary || ''}\n\n`;
    
    if (currentNote.tasks_table && currentNote.tasks_table.length > 0) {
      text += `## 3) DESCRIPTION OF LEVELS / TASKS\n\n`;
      currentNote.tasks_table.forEach(r => {
        text += `### ${r.level}\n- **Goal**: ${r.goal}\n- **Tasks**: ${r.main_tasks?.join(', ')}\n- **Input**: ${r.example_input}\n- **Output**: ${r.example_output}\n\n`;
      });
    }

    if (dList.length > 0) {
      text += `## Key Definitions & Formulas\n`;
      dList.forEach(d => {
        text += `- **${d.term}**: ${d.explanation}\n`;
        if (d.formula_or_rule) text += `  Formula: \`${d.formula_or_rule}\`\n`;
      });
      text += `\n`;
    }

    if (qList.length > 0) {
      text += `## Extracted Questions & Model Answers\n\n`;
      qList.forEach((q, i) => {
        text += `### Q${i+1}. [${q.marks} Marks • ${q.question_type}] ${q.question}\n`;
        if (q.answer_bullets && q.answer_bullets.length > 0) {
          q.answer_bullets.forEach(b => { text += `- ${b}\n`; });
        } else if (q.model_answer) {
          text += `${q.model_answer}\n`;
        }
        if (q.key_exam_tip) text += `*Examiner Tip: ${q.key_exam_tip}*\n`;
        text += `\n`;
      });
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  // Print direct to PDF
  const handlePrint = () => {
    window.print();
  };

  // Download backend PDF
  const handleDownloadPDF = () => {
    const noteId = currentNote?.id || currentNote?.note_id;
    if (!noteId || String(noteId).startsWith('demo-')) {
      window.print();
      return;
    }
    window.open(`/api/handwritten-notes/${noteId}/pdf`, '_blank');
  };

  // Filtered Questions list
  const filteredQuestions = (currentNote?.questions_and_answers || []).filter(q => {
    const matchesMarks = marksFilter === 'all' || String(q.marks) === marksFilter;
    const matchesSearch = !searchQuery.trim() || 
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.model_answer && q.model_answer.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.question_type && q.question_type.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesMarks && matchesSearch;
  });

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* ================= HERO HEADER ================= */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #6366f1 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '2.25rem 2rem',
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 12px 30px -4px rgba(30, 58, 138, 0.35)'
      }}>
        {/* Ambient background doodles & stamps */}
        <div style={{
          position: 'absolute',
          top: '-15px',
          right: '25px',
          opacity: 0.12,
          fontSize: '9rem',
          fontWeight: 900,
          fontFamily: "'Patrick Hand', cursive",
          userSelect: 'none',
          pointerEvents: 'none'
        }}>
          100/100
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '780px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <span className="badge" style={{ background: '#fef08a', color: '#854d0e', fontWeight: 800, padding: '0.35rem 0.85rem' }}>
                ✍️ Card 8 &bull; Universal Handwritten Revision Sheets
              </span>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.25)', color: '#fff' }}>
                Transforms ANY Subject Into Topper Notes Style
              </span>
            </div>

            <h1 style={{ fontSize: '2.1rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.65rem' }}>
              Handwritten Notes & Master Q&A Maker 📝
            </h1>
            <p style={{ fontSize: '0.975rem', opacity: 0.95, lineHeight: 1.55 }}>
              Upload any textbook, lecture PDF, or class notes photo for <b>ANY subject</b> (Operating Systems, Physics, DBMS, Computer Networks, NLP, Chemistry, etc.). Card 8 transforms it into an <b>authentic visual topper study sheet</b> with doodles, pink wavy ribbon underlines, vertical hierarchy stacks, 4-column comparison tables, horizontal pipeline flowcharts, and <b>exhaustive 2M, 5M, and 10M Questions & Model Solutions</b> with instant PDF download.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              onClick={handleLoadScreenshotDemo}
              className="btn"
              style={{
                background: '#fef08a',
                color: '#854d0e',
                fontWeight: 800,
                border: 'none',
                boxShadow: '0 4px 14px rgba(234, 179, 8, 0.4)',
                gap: '0.5rem'
              }}
            >
              <span>⭐ View Screenshot Style Demo</span>
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className="btn btn-secondary"
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                color: '#1e3a8a',
                fontWeight: 700,
                border: 'none',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
              }}
            >
              <BookOpen size={17} />
              <span>Saved Notes ({savedNotes.length})</span>
            </button>
            <button
              onClick={() => onNavigate && onNavigate('trash')}
              className="btn"
              style={{
                background: 'rgba(239, 68, 68, 0.25)',
                color: '#fee2e2',
                border: '1px solid rgba(254, 202, 202, 0.3)',
                fontSize: '0.825rem',
                padding: '0.4rem 0.85rem'
              }}
            >
              <Trash2 size={15} />
              <span>Card 9: Trash Recovery</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {notification && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1.5px solid var(--accent-emerald)',
          color: 'var(--accent-emerald)',
          padding: '0.9rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontWeight: 600
        }}>
          <CheckCircle2 size={20} />
          <span>{notification}</span>
        </div>
      )}
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1.5px solid var(--accent-rose)',
          color: 'var(--accent-rose)',
          padding: '0.9rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontWeight: 600
        }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* ================= INPUT & UPLOAD WORKBENCH ================= */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
              Create New Handwritten Revision Note (Any Subject)
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Give any topic or question title, and optionally attach a <b>PDF</b> or <b>Photo / Image</b>. The AI formats it into this exact visual topper study layout!
            </p>
          </div>
        </div>

        {/* 1-Click Multi-Subject Style Demonstrators */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap',
          marginBottom: '1.25rem',
          padding: '0.75rem 1rem',
          background: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)'
        }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)' }}>
            ⚡ 1-Click Topic Style Demonstrators:
          </span>
          <button
            type="button"
            onClick={handleLoadScreenshotDemo}
            className="btn btn-secondary"
            style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', fontWeight: 700, gap: '0.35rem' }}
          >
            🧠 NLP: Levels/Tasks (Screenshot Reference)
          </button>
          <button
            type="button"
            onClick={handleLoadOSDemo}
            className="btn btn-secondary"
            style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', fontWeight: 700, gap: '0.35rem' }}
          >
            💻 OS: Paging & Virtual Memory
          </button>
          <button
            type="button"
            onClick={handleLoadNetworksDemo}
            className="btn btn-secondary"
            style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', fontWeight: 700, gap: '0.35rem' }}
          >
            🌐 Networks: 7-Layer OSI Model
          </button>
        </div>

        <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {/* Topic Input */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                Topic / Question Title <span style={{ color: 'var(--accent-rose)' }}>*</span>
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Operating Systems: Virtual Memory, Physics: Thermodynamics, or Explain Levels of NLP"
                className="input"
                style={{ width: '100%', padding: '0.75rem 1rem' }}
                required
              />
            </div>

            {/* Subject Name Input */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                Subject / Course Name
              </label>
              <input
                type="text"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="e.g. Computer Science, Physics, Electrical Engineering, etc."
                className="input"
                style={{ width: '100%', padding: '0.75rem 1rem' }}
              />
            </div>
          </div>

          {/* Upload Area: PDF or Photo */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>
              Upload Study Material (PDF or Photo / Image)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '1.75rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: file ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-subtle)',
                transition: 'var(--transition)',
                borderColor: file ? 'var(--primary)' : 'var(--border-light)'
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,image/*,.png,.jpg,.jpeg,.webp,.docx,.txt,.zip,.doc,.md,*"
                style={{ display: 'none' }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                {previewImage ? (
                  <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                    <img
                      src={previewImage}
                      alt="Upload Preview"
                      style={{ maxHeight: '110px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}
                    />
                    <span className="badge badge-primary" style={{ position: 'absolute', bottom: '-8px', right: '-8px', fontSize: '0.65rem' }}>
                      Photo OCR Ready
                    </span>
                  </div>
                ) : file ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 700 }}>
                    <FileText size={28} />
                    <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                ) : (
                  <>
                    <Upload size={32} style={{ color: 'var(--primary)', opacity: 0.8 }} />
                    <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                      Drop your Lecture PDF, Handwritten Class Notes Photo, or Textbook Page here
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Supports any subject &bull; RapidOCR extracts diagrams, flowcharts, formulas, and text
                    </div>
                  </>
                )}

                {file && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setPreviewImage(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', marginTop: '0.35rem' }}
                  >
                    Remove File
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Optional Raw Notes or Syllabus Excerpt */}
          <div>
            <button
              type="button"
              onClick={() => setShowRawInput(!showRawInput)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: 0
              }}
            >
              {showRawInput ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              <span>{showRawInput ? 'Hide Extra Text Paste' : '+ Paste Raw Notes / Scribbles Directly (Optional)'}</span>
            </button>

            {showRawInput && (
              <div style={{ marginTop: '0.5rem' }}>
                <textarea
                  value={rawNotes}
                  onChange={(e) => setRawNotes(e.target.value)}
                  placeholder="Paste lecture notes, professor's bullet points, or syllabus definitions here..."
                  className="input"
                  style={{ width: '100%', minHeight: '90px', padding: '0.75rem', fontSize: '0.85rem' }}
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
            <button
              type="submit"
              disabled={generating}
              className="btn btn-primary"
              style={{
                padding: '0.85rem 2rem',
                fontSize: '1rem',
                fontWeight: 800,
                gap: '0.65rem',
                boxShadow: '0 8px 24px var(--primary-glow)'
              }}
            >
              {generating ? (
                <>
                  <RefreshCw size={18} className="spin" />
                  <span>Extracting Concepts & Formatting Topper Sheet...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Generate Handwritten Revision Sheet & Q&As ✍️</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ================= NOTEBOOK VIEWER & TOOLBAR ================= */}
      {currentNote && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Customization & View Toolbar */}
          <div className="glass-card no-print" style={{
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            {/* View Selector Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-subtle)', padding: '0.3rem', borderRadius: 'var(--radius-md)' }}>
              <button
                onClick={() => setActiveTab('notebook')}
                className={`btn ${activeTab === 'notebook' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', fontWeight: 700 }}
              >
                📖 Visual Note Sheet (Screenshot Style)
              </button>
              <button
                onClick={() => setActiveTab('qa-bank')}
                className={`btn ${activeTab === 'qa-bank' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', fontWeight: 700 }}
              >
                ❓ Q&A Explorer ({currentNote.questions_and_answers?.length || 0})
              </button>
            </div>

            {/* Notebook Styling Options (Paper, Ink, Font) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
              {/* Paper selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Paper:</span>
                <select
                  value={paperStyle}
                  onChange={(e) => setPaperStyle(e.target.value)}
                  className="input"
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', fontWeight: 600 }}
                >
                  <option value="plain">📄 Clean White Note</option>
                  <option value="ruled">📝 Ruled Student Pad</option>
                  <option value="grid">📐 Grid / Graph</option>
                  <option value="yellow">🟡 Vintage Yellow Pad</option>
                </select>
              </div>

              {/* Ink Color */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Ink:</span>
                {[
                  { color: '#1e1b4b', label: 'Dark Navy Ink' },
                  { color: '#1d4ed8', label: 'Royal Blue' },
                  { color: '#0f172a', label: 'Black Ink' },
                  { color: '#6d28d9', label: 'Purple Pen' },
                  { color: '#047857', label: 'Emerald' }
                ].map(c => (
                  <button
                    key={c.color}
                    onClick={() => setInkColor(c.color)}
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: c.color,
                      border: inkColor === c.color ? '2.5px solid #fff' : '1px solid rgba(0,0,0,0.2)',
                      boxShadow: inkColor === c.color ? '0 0 0 2px var(--primary)' : 'none',
                      cursor: 'pointer'
                    }}
                    title={c.label}
                  />
                ))}
              </div>

              {/* Handwriting Font */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Font:</span>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="input"
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', fontWeight: 600 }}
                >
                  <option value="font-patrick">🖊️ Patrick Hand (Neat & Clean - Recommended)</option>
                  <option value="font-caveat">✍️ Caveat (Cursive)</option>
                  <option value="font-kalam">🖋️ Kalam (Ballpoint)</option>
                  <option value="font-architects">📐 Architects Daughter</option>
                  <option value="font-gaegu">🎨 Gaegu (Cute Korean Hand)</option>
                </select>
              </div>
            </div>

            {/* Action Buttons (Download PDF, Print, Copy, Delete) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={handleDownloadPDF}
                className="btn btn-primary"
                style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem', fontWeight: 700, gap: '0.4rem' }}
                title="Download Official Examfriend PDF"
              >
                <Download size={15} />
                <span>Download PDF</span>
              </button>

              <button
                onClick={handlePrint}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem', gap: '0.35rem' }}
                title="Print or Save as PDF in authentic handwriting"
              >
                <Printer size={15} />
                <span>Print</span>
              </button>

              <button
                onClick={handleCopyNotes}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                title="Copy Markdown of entire note"
              >
                {copied ? <Check size={15} color="var(--accent-emerald)" /> : <Copy size={15} />}
              </button>

              <button
                onClick={() => handleDeleteNote(currentNote.id || currentNote.note_id)}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.65rem', color: 'var(--accent-rose)' }}
                title="Move to Card 9: Trash"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>

          {/* ================= TAB 1: AUTHENTIC HANDWRITTEN REVISION SHEET (SCREENSHOT MATCH) ================= */}
          {activeTab === 'notebook' && (
            <div
              className={`print-only-notebook paper-${paperStyle} ${fontFamily}`}
              style={{
                borderRadius: '16px',
                padding: '2.75rem 2.25rem',
                border: '2px solid #cbd5e1',
                boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.12)',
                position: 'relative',
                color: inkColor,
                minHeight: '900px',
                transition: 'all 0.2s ease',
                background: '#ffffff'
              }}
            >
              {/* Binder spiral rings along the top or margin */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderBottom: '1px dashed #cbd5e1',
                paddingBottom: '0.5rem',
                marginBottom: '1.25rem',
                fontSize: '0.85rem',
                color: '#64748b',
                fontFamily: 'sans-serif'
              }}>
                <span style={{ fontWeight: 700, color: '#dc2626' }}>
                  EXAMFRIEND &bull; TOPPER REVISION NOTEBOOK
                </span>
                <span>
                  Subject: <b>{currentNote.subject_name || 'Academic Course'}</b> &bull; Date: {new Date(currentNote.created_at || Date.now()).toLocaleDateString()}
                </span>
              </div>

              {/* ================= HEADER: STAR DOODLE + QUESTION TITLE + PINK WAVY RIBBON + BOOK DOODLE ================= */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                marginBottom: '2rem',
                position: 'relative'
              }}>
                {/* Left Star Doodle */}
                <div style={{
                  fontSize: '2.5rem',
                  lineHeight: 1,
                  userSelect: 'none',
                  filter: 'drop-shadow(0 2px 4px rgba(234, 179, 8, 0.3))'
                }}>
                  {currentNote.doodle_left || '⭐'}
                </div>

                {/* Center Title & Pink Wavy Ribbon Underline */}
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <h2 style={{
                    fontSize: '2.2rem',
                    fontWeight: 800,
                    color: '#701a75',
                    letterSpacing: '-0.01em',
                    margin: 0,
                    lineHeight: 1.2
                  }}>
                    {currentNote.question_number || '1.'} {currentNote.question_title || currentNote.topic}
                  </h2>
                  {/* Pink hand-drawn wavy ribbon underline matching screenshot */}
                  <div className="note-wavy-ribbon" style={{ margin: '0.5rem auto 0', maxWidth: '440px', height: '14px' }} />
                </div>

                {/* Right Book Doodle with sparkles */}
                <div style={{
                  fontSize: '2.5rem',
                  lineHeight: 1,
                  userSelect: 'none',
                  filter: 'drop-shadow(0 2px 4px rgba(99, 102, 241, 0.3))'
                }}>
                  {currentNote.doodle_right || '📖✨'}
                </div>
              </div>

              {/* ================= SECTION 1 & 2: TWO COLUMNS (INTRODUCTION & HIERARCHY STACK) ================= */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(280px, 1fr) minmax(360px, 1.4fr)',
                gap: '2.25rem',
                marginBottom: '2.25rem',
                alignItems: 'start'
              }}>
                {/* 1) INTRODUCTION */}
                <div>
                  <div style={{
                    fontSize: '1.45rem',
                    fontWeight: 800,
                    color: '#86198f',
                    marginBottom: '0.65rem'
                  }}>
                    1) INTRODUCTION
                  </div>
                  <div style={{
                    fontSize: '1.25rem',
                    lineHeight: '34px',
                    color: inkColor,
                    letterSpacing: '0.01em'
                  }}>
                    {currentNote.introduction || currentNote.core_summary || (
                      "This topic performs a number of sequential operations arranged in different hierarchical levels. Output of one level becomes the input for the next level."
                    )}
                  </div>
                </div>

                {/* 2) LEVELS (HIERARCHY) */}
                <div>
                  <div style={{
                    fontSize: '1.45rem',
                    fontWeight: 800,
                    color: '#86198f',
                    marginBottom: '0.65rem'
                  }}>
                    2) LEVELS / HIERARCHY
                  </div>

                  {/* Vertical stack of rounded pastel boxes connected with upward arrows */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                    alignItems: 'stretch'
                  }}>
                    {(currentNote.hierarchy || [
                      { level_num: 5, name: '5. Application Level', description: 'Understanding real-world context & goal execution', color: '#e0f2fe', borderColor: '#7dd3fc' },
                      { level_num: 4, name: '4. Coordination Level', description: 'State synchronization and error tracking', color: '#dcfce7', borderColor: '#86efac' },
                      { level_num: 3, name: '3. Core Semantic Level', description: 'Algorithmic transformation and logic evaluation', color: '#fef9c3', borderColor: '#fde047' },
                      { level_num: 2, name: '2. Structural Level', description: 'Syntax validation, schemas, and constraint checking', color: '#ffedd5', borderColor: '#fdba74' },
                      { level_num: 1, name: '1. Ingestion Level', description: 'Raw signal ingestion and primitive mapping', color: '#f3e8ff', borderColor: '#d8b4fe' }
                    ]).map((lvl, lIdx, arr) => (
                      <React.Fragment key={lvl.level_num || lIdx}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.75rem',
                          padding: '0.45rem 0.85rem',
                          background: lvl.color || '#f1f5f9',
                          border: `1.5px solid ${lvl.borderColor || '#cbd5e1'}`,
                          borderRadius: '10px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                        }}>
                          <div style={{
                            fontWeight: 800,
                            fontSize: '1.15rem',
                            color: '#1e293b',
                            minWidth: '150px',
                            flexShrink: 0
                          }}>
                            {lvl.name}
                          </div>
                          <span style={{ color: '#94a3b8', fontWeight: 800 }}>➔</span>
                          <div style={{
                            fontSize: '1.05rem',
                            color: '#334155',
                            fontStyle: 'italic',
                            textAlign: 'right',
                            lineHeight: 1.2
                          }}>
                            {lvl.description}
                          </div>
                        </div>
                        {lIdx < arr.length - 1 && (
                          <div style={{
                            textAlign: 'center',
                            color: '#64748b',
                            fontSize: '1.15rem',
                            fontWeight: 900,
                            lineHeight: 1,
                            margin: '-2px 0'
                          }}>
                            ↑
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>

              {/* ================= SECTION 3: DESCRIPTION OF LEVELS / TASKS (COMPARISON TABLE) ================= */}
              <div style={{ marginBottom: '2.5rem' }}>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: '#86198f',
                  marginBottom: '0.75rem'
                }}>
                  3) DESCRIPTION OF LEVELS / TASKS
                </div>

                {/* Hand-drawn style structured comparison table matching screenshot */}
                <div style={{
                  border: '1.5px solid #475569',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  background: '#ffffff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '1.15rem',
                    lineHeight: 1.35
                  }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #475569' }}>
                        <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left', borderRight: '1px solid #94a3b8', width: '20%', fontWeight: 800, color: '#0f172a' }}>
                          Level / Task
                        </th>
                        <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left', borderRight: '1px solid #94a3b8', width: '22%', fontWeight: 800, color: '#0f172a' }}>
                          Goal
                        </th>
                        <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left', borderRight: '1px solid #94a3b8', width: '28%', fontWeight: 800, color: '#0f172a' }}>
                          Main Tasks
                        </th>
                        <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left', width: '30%', fontWeight: 800, color: '#0f172a' }}>
                          Example
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(currentNote.tasks_table || [
                        {
                          level: '1. Primitive Ingestion Level',
                          goal: 'Capture raw parameters and isolate base entities.',
                          main_tasks: ['Parameter normalization', 'Validation checks', 'Input buffering'],
                          example_input: 'Input: Raw data stream',
                          example_output: 'Output: [Frame 1] [Frame 2]'
                        }
                      ]).map((row, rIdx, tArr) => (
                        <tr key={rIdx} style={{
                          borderBottom: rIdx < tArr.length - 1 ? '1px solid #cbd5e1' : 'none',
                          verticalAlign: 'top',
                          background: rIdx % 2 === 0 ? '#ffffff' : '#fafafa'
                        }}>
                          {/* Level */}
                          <td style={{ padding: '0.75rem 0.85rem', borderRight: '1px solid #94a3b8', fontWeight: 800, color: '#1e293b' }}>
                            {row.level}
                          </td>

                          {/* Goal */}
                          <td style={{ padding: '0.75rem 0.85rem', borderRight: '1px solid #94a3b8', color: '#334155' }}>
                            {row.goal}
                          </td>

                          {/* Main Tasks */}
                          <td style={{ padding: '0.75rem 0.85rem', borderRight: '1px solid #94a3b8' }}>
                            <ul style={{ margin: 0, paddingLeft: '1.15rem' }}>
                              {(row.main_tasks || []).map((t, tIdx) => (
                                <li key={tIdx} style={{ marginBottom: '0.2rem', color: '#1e293b' }}>
                                  {t}
                                </li>
                              ))}
                            </ul>
                          </td>

                          {/* Example */}
                          <td style={{ padding: '0.75rem 0.85rem' }}>
                            {row.example_input && (
                              <div style={{ marginBottom: '0.35rem' }}>
                                <span style={{ color: '#dc2626', fontWeight: 800, marginRight: '0.35rem' }}>Input :</span>
                                <span style={{ color: '#0f172a', fontWeight: 600 }}>{row.example_input}</span>
                              </div>
                            )}
                            {row.example_output && (
                              <div>
                                <span style={{ color: '#4f46e5', fontWeight: 800, marginRight: '0.35rem' }}>Output :</span>
                                <span style={{ color: '#0f172a', fontWeight: 600, wordBreak: 'break-word' }}>{row.example_output}</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ================= SECTION 4: PIPELINE OF TASKS (HORIZONTAL FLOWCHART) ================= */}
              <div style={{ marginBottom: '2.5rem' }}>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: '#86198f',
                  marginBottom: '0.75rem'
                }}>
                  4) PIPELINE OF TASKS
                </div>

                {/* Horizontal Flowchart */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  gap: '0.45rem',
                  padding: '1.25rem 0.75rem',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1'
                }}>
                  {(currentNote.pipeline || [
                    { step: "Raw Input Signal", color: "#f1f5f9", borderColor: "#94a3b8" },
                    { step: "Normalization Layer", color: "#f3e8ff", borderColor: "#c084fc" },
                    { step: "Core Logic Engine", color: "#ffedd5", borderColor: "#fb923c" },
                    { step: "State Verification", color: "#fef9c3", borderColor: "#facc15" },
                    { step: "Output Delivery", color: "#dcfce7", borderColor: "#4ade80" }
                  ]).map((p, pIdx, pArr) => (
                    <React.Fragment key={pIdx}>
                      <div style={{
                        background: p.color || '#ffffff',
                        border: `1.5px solid ${p.borderColor || '#94a3b8'}`,
                        borderRadius: '8px',
                        padding: '0.55rem 0.85rem',
                        fontWeight: 800,
                        fontSize: '1.05rem',
                        color: '#1e293b',
                        textAlign: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                      }}>
                        {p.step}
                      </div>
                      {pIdx < pArr.length - 1 && (
                        <span style={{ color: '#64748b', fontWeight: 900, fontSize: '1.2rem' }}>➔</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Caption beneath pipeline */}
                <div style={{
                  textAlign: 'center',
                  marginTop: '0.65rem',
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: '#64748b',
                  fontStyle: 'italic'
                }}>
                  〰〰〰 {currentNote.pipeline_caption || "Output of one level is input to the next level"} 〰〰〰
                </div>
              </div>

              {/* ================= BOTTOM ROW: KEY POINTS & EXAMPLE (END TO END) ================= */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2.5rem'
              }}>
                {/* Left: Key Points */}
                <div style={{
                  background: '#fff5f7',
                  border: '2px dashed #f472b6',
                  borderRadius: '14px',
                  padding: '1.25rem 1.5rem',
                  position: 'relative'
                }}>
                  <div style={{ position: 'absolute', top: '10px', right: '12px', fontSize: '1.25rem' }}>🌸</div>
                  <div style={{ position: 'absolute', bottom: '10px', left: '12px', fontSize: '1.25rem' }}>🌸</div>

                  <div style={{
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    color: '#be185d',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}>
                    ⭐ Key Points
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.35rem', fontSize: '1.15rem', lineHeight: '28px', color: '#831843' }}>
                    {(currentNote.key_points || [
                      "Execution starts from the lowest primitive tier and moves to higher contextual levels.",
                      "Higher levels require the validated results of lower levels.",
                      "All levels together provide robust end-to-end operation."
                    ]).map((kp, kIdx) => (
                      <li key={kIdx} style={{ marginBottom: '0.35rem' }}>
                        {kp}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Right: Example (End to End) */}
                <div style={{
                  background: '#fef9c3',
                  border: '2px solid #fde047',
                  borderRadius: '14px',
                  padding: '1.25rem 1.5rem',
                  position: 'relative',
                  boxShadow: '0 4px 12px rgba(234, 179, 8, 0.08)'
                }}>
                  <div style={{ position: 'absolute', top: '10px', right: '12px', fontSize: '1.25rem' }}>🌸</div>

                  <div style={{
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    color: '#854d0e',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}>
                    Example (End to End) 🌸
                  </div>

                  {currentNote.end_to_end_example ? (
                    <div>
                      <div style={{ fontWeight: 800, color: '#dc2626', marginBottom: '0.45rem', fontSize: '1.15rem' }}>
                        Input : <span style={{ color: '#0f172a', fontWeight: 600 }}>{currentNote.end_to_end_example.input_sentence}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {(currentNote.end_to_end_example.steps || []).map((st, sIdx) => (
                          <div key={sIdx} style={{ fontSize: '1.1rem', lineHeight: '24px', color: '#713f12' }}>
                            <b style={{ color: '#854d0e' }}>{st.stage} :</b> {st.desc}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontWeight: 800, color: '#dc2626', marginBottom: '0.45rem', fontSize: '1.15rem' }}>
                        Input : <span style={{ color: '#0f172a', fontWeight: 600 }}>Sample input trace</span>
                      </div>
                      <div style={{ fontSize: '1.1rem', lineHeight: '24px', color: '#713f12' }}>
                        <b>1. Ingest :</b> Isolate parameters.<br />
                        <b>2. Validate :</b> Check constraints.<br />
                        <b>3. Process :</b> Evaluate transformations.<br />
                        <b>4. Verify :</b> Commit state.<br />
                        <b>5. Deliver :</b> Return result.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ================= SECTION 5: MUST-REMEMBER DEFINITIONS & FORMULAS ================= */}
              {currentNote.definitions_and_formulas && currentNote.definitions_and_formulas.length > 0 && (
                <div style={{ marginBottom: '2.5rem' }}>
                  <div style={{
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    color: '#dc2626',
                    marginBottom: '0.75rem',
                    textDecoration: 'underline wavy #ef4444'
                  }}>
                    5) Must-Remember Definitions & Formulas
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '1rem'
                  }}>
                    {currentNote.definitions_and_formulas.map((def, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: 'rgba(255, 255, 255, 0.85)',
                          backdropFilter: 'blur(4px)',
                          border: '1.5px solid rgba(147, 197, 253, 0.7)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.85rem 1rem',
                          boxShadow: '1px 2px 6px rgba(0,0,0,0.04)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                          <span className={`hl-${def.highlight_color || 'yellow'}`} style={{ fontWeight: 800, fontSize: '1.2rem' }}>
                            {def.term}
                          </span>
                        </div>
                        <p style={{ fontSize: '1.1rem', margin: '0.3rem 0', lineHeight: '26px' }}>
                          {def.explanation}
                        </p>
                        {def.formula_or_rule && (
                          <div style={{
                            marginTop: '0.4rem',
                            padding: '0.35rem 0.65rem',
                            background: 'rgba(59, 130, 246, 0.1)',
                            borderRadius: 'var(--radius-sm)',
                            borderLeft: '3px solid #3b82f6',
                            fontSize: '1.15rem',
                            fontWeight: 700,
                            color: '#1e40af'
                          }}>
                            📐 {def.formula_or_rule}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ================= SECTION 6: MASTER MULTI-MARK Q&A COLLECTION (2M, 5M, 10M) ================= */}
              <div style={{ marginBottom: '2.5rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '2px solid rgba(220, 38, 38, 0.3)',
                  paddingBottom: '0.5rem',
                  marginBottom: '1.25rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    color: '#dc2626',
                    textDecoration: 'underline wavy #ef4444'
                  }}>
                    6) Exhaustive Questions & Answers with Every Detail
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={() => setSelfTestMode(!selfTestMode)}
                      className="btn btn-secondary no-print"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', gap: '0.35rem' }}
                    >
                      {selfTestMode ? <Eye size={14} /> : <EyeOff size={14} />}
                      <span>{selfTestMode ? 'Exit Self-Test' : 'Self-Test Mode (Hide Answers)'}</span>
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {filteredQuestions.map((q, idx) => {
                    const isAnswerVisible = !selfTestMode || revealedAnswers[q.id || idx];

                    return (
                      <div
                        key={q.id || idx}
                        style={{
                          background: 'rgba(255, 255, 255, 0.9)',
                          borderRadius: 'var(--radius-md)',
                          padding: '1.25rem 1.5rem',
                          border: '1px solid rgba(147, 197, 253, 0.5)',
                          borderLeft: `5px solid ${q.marks >= 10 ? '#dc2626' : q.marks >= 5 ? '#f59e0b' : '#3b82f6'}`,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                        }}
                      >
                        {/* Question Header */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.65rem' }}>
                          <div style={{ fontSize: '1.35rem', fontWeight: 800, lineHeight: 1.35 }}>
                            <span style={{ color: '#dc2626', marginRight: '0.4rem' }}>Q{idx + 1}.</span>
                            {q.question}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                            <span
                              className="badge"
                              style={{
                                background: q.marks >= 10 ? '#dc2626' : q.marks >= 5 ? '#f59e0b' : '#3b82f6',
                                color: '#fff',
                                fontWeight: 800,
                                fontSize: '0.85rem'
                              }}
                            >
                              {q.marks} Marks
                            </span>
                            <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>
                              {q.question_type}
                            </span>
                          </div>
                        </div>

                        {/* Self Test Toggle */}
                        {selfTestMode && (
                          <div style={{ marginBottom: '0.5rem' }}>
                            <button
                              type="button"
                              onClick={() => toggleAnswer(q.id || idx)}
                              className="btn btn-secondary no-print"
                              style={{ padding: '0.25rem 0.65rem', fontSize: '0.8rem', gap: '0.35rem' }}
                            >
                              {isAnswerVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                              <span>{isAnswerVisible ? 'Hide Answer' : 'Reveal Model Answer & Steps'}</span>
                            </button>
                          </div>
                        )}

                        {/* Answer Body */}
                        {isAnswerVisible && (
                          <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed rgba(147, 197, 253, 0.5)' }}>
                            <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#1e40af', marginBottom: '0.35rem' }}>
                              ✍️ Model Solution & Points Needed for Full Marks:
                            </div>

                            {q.answer_bullets && q.answer_bullets.length > 0 ? (
                              <ul style={{ margin: 0, paddingLeft: '1.35rem', fontSize: '1.2rem', lineHeight: '30px' }}>
                                {q.answer_bullets.map((b, bIdx) => (
                                  <li key={bIdx} style={{ marginBottom: '0.25rem' }}>{b}</li>
                                ))}
                              </ul>
                            ) : (
                              <p style={{ fontSize: '1.2rem', lineHeight: '30px', margin: 0 }}>
                                {q.model_answer}
                              </p>
                            )}

                            {/* Examiner Tip */}
                            {q.key_exam_tip && (
                              <div style={{
                                marginTop: '0.65rem',
                                padding: '0.4rem 0.75rem',
                                background: 'rgba(245, 158, 11, 0.1)',
                                borderRadius: 'var(--radius-sm)',
                                borderLeft: '3px solid #f59e0b',
                                fontSize: '1.1rem',
                                color: '#92400e',
                                fontWeight: 600
                              }}>
                                ⚡ <b>Examiner Tip:</b> {q.key_exam_tip}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ================= SECTION 7: MEMORY TRICKS & MNEMONICS ================= */}
              {currentNote.mnemonics_and_tricks && currentNote.mnemonics_and_tricks.length > 0 && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1.5px solid var(--accent-emerald)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#047857', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Lightbulb size={20} /> High-Yield Memory Hooks & Mnemonics:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.35rem', fontSize: '1.15rem', color: '#064e3b' }}>
                    {currentNote.mnemonics_and_tricks.map((trick, tIdx) => (
                      <li key={tIdx} style={{ marginBottom: '0.3rem' }}>{trick}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sticky Margin Annotations */}
              {currentNote.margin_notes && currentNote.margin_notes.length > 0 && (
                <div style={{
                  background: 'linear-gradient(135deg, #fef08a 0%, #fef9c3 100%)',
                  color: '#713f12',
                  padding: '0.85rem 1.25rem',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: '2px 4px 12px rgba(0,0,0,0.08)',
                  marginBottom: '1.75rem',
                  borderLeft: '4px solid #eab308'
                }}>
                  <div style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Bookmark size={16} /> Important Margin Tips:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '1.1rem' }}>
                    {currentNote.margin_notes.map((m, idx) => (
                      <li key={idx} style={{ marginBottom: '0.2rem' }}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Notebook Footer Note */}
              <div style={{
                textAlign: 'center',
                borderTop: '2px dashed rgba(220, 38, 38, 0.4)',
                paddingTop: '1rem',
                fontSize: '1.15rem',
                color: '#64748b'
              }}>
                ✨ EXAMFRIEND Master Revision Notebook &bull; Study Daily, Test Yourself & Ace the Exam!
              </div>
            </div>
          )}

          {/* ================= TAB 2: Q&A BANK EXPLORER ================= */}
          {activeTab === 'qa-bank' && (
            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
                    Extracted Questions & Model Answers
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Filter by examination marks (2M, 5M, 10M) or search for specific concepts.
                  </p>
                </div>

                {/* Filter and Search Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {/* Search */}
                  <div style={{ position: 'relative' }}>
                    <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search question or solution..."
                      className="input"
                      style={{ paddingLeft: '2rem', paddingRight: '0.75rem', fontSize: '0.85rem' }}
                    />
                  </div>

                  {/* Marks filter pills */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'var(--bg-subtle)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
                    {['all', '2', '5', '10'].map(m => (
                      <button
                        key={m}
                        onClick={() => setMarksFilter(m)}
                        className={`btn ${marksFilter === m ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', fontWeight: 700 }}
                      >
                        {m === 'all' ? 'All Marks' : `${m} Marks`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Questions List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredQuestions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No questions found matching your filter.
                  </div>
                ) : (
                  filteredQuestions.map((q, idx) => (
                    <div
                      key={q.id || idx}
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1.5px solid var(--border-light)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1.25rem',
                        transition: 'var(--transition)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                          <span style={{ color: 'var(--primary)', marginRight: '0.4rem' }}>Q{idx + 1}.</span>
                          {q.question}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                          <span className={`badge ${q.marks >= 10 ? 'badge-danger' : q.marks >= 5 ? 'badge-warning' : 'badge-primary'}`}>
                            {q.marks} Marks
                          </span>
                          <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                            {q.question_type}
                          </span>
                        </div>
                      </div>

                      <div style={{
                        background: 'var(--bg-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.85rem 1rem',
                        marginTop: '0.5rem',
                        fontSize: '0.9rem',
                        lineHeight: 1.55
                      }}>
                        <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.3rem' }}>
                          Model Solution:
                        </div>
                        {q.answer_bullets && q.answer_bullets.length > 0 ? (
                          <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                            {q.answer_bullets.map((b, bIdx) => (
                              <li key={bIdx} style={{ marginBottom: '0.2rem' }}>{b}</li>
                            ))}
                          </ul>
                        ) : (
                          <p style={{ margin: 0 }}>{q.model_answer}</p>
                        )}

                        {q.key_exam_tip && (
                          <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--accent-amber)', fontWeight: 600 }}>
                            💡 {q.key_exam_tip}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ================= TAB 3 / MODAL: SAVED NOTES LIBRARY ================= */}
      {activeTab === 'library' && (
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
                Saved Handwritten Notes Library
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Access all previously extracted study topics, view them on lined paper, or download PDF.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('notebook')}
              className="btn btn-secondary"
              style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
            >
              Back to Notebook
            </button>
          </div>

          {loadingSaved ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <RefreshCw size={24} className="spin" style={{ color: 'var(--primary)' }} />
            </div>
          ) : savedNotes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No notes saved yet. Generate your first topic above!
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {savedNotes.map(n => (
                <div
                  key={n.id}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1.5px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'var(--transition)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                        {n.file_type ? n.file_type.toUpperCase() : 'PDF'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(n.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.35rem' }}>
                      {n.topic}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                      Subject: <b>{n.subject_name || 'General'}</b> &bull; {n.total_questions || n.questions_and_answers?.length || 0} Questions Extracted
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
                    <button
                      onClick={() => {
                        setCurrentNote(n);
                        setActiveTab('notebook');
                      }}
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 700 }}
                    >
                      Open Note 📖
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <button
                        onClick={() => window.open(`/api/handwritten-notes/${n.id}/pdf`, '_blank')}
                        className="btn btn-secondary btn-icon"
                        style={{ padding: '0.35rem' }}
                        title="Download PDF"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(n.id)}
                        className="btn btn-secondary btn-icon"
                        style={{ padding: '0.35rem', color: 'var(--accent-rose)' }}
                        title="Move to Card 9: Trash"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
