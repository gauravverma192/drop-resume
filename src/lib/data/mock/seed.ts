import { MOCK_OWNER } from "@/lib/auth/mock-session";
import { submissionFileUrl } from "@/lib/contracts/submissions";

import { emptyStore, type StoredRole, type StoredSubmission, type Store } from "./store";

const MOCK_PDF = new TextEncoder().encode(
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\ntrailer<</Root 1 0 R>>\n%%EOF\n"
);

const ROLE_BACKEND = "role_backend";
const ROLE_FULLSTACK = "role_fullstack";
const ROLE_DESIGNER = "role_designer";

function at(hoursAgo: number) {
  return new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
}

function pdfFile(id: string): Pick<
  StoredSubmission,
  "fileUrl" | "fileName" | "fileMime" | "fileSize" | "storagePath" | "bytes"
> {
  return {
    fileUrl: submissionFileUrl(id),
    fileName: "resume.pdf",
    fileMime: "application/pdf",
    fileSize: MOCK_PDF.byteLength,
    storagePath: `resumes/${id}.pdf`,
    bytes: MOCK_PDF,
  };
}

type SeedRow = {
  id: string;
  roleId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string | null;
  currentTitle: string | null;
  currentCompany: string | null;
  yearsExperience: number | null;
  highlySkilledAt: string | null;
  location: string | null;
  skills: string[];
  matchScore: number | null;
  matchScoreReason: string | null;
  aiSummary: string | null;
  status: StoredSubmission["status"];
  parseStatus: StoredSubmission["parseStatus"];
  parseError: string | null;
  rawText: string | null;
  createdAt: string;
};

function submission(row: SeedRow): StoredSubmission {
  return {
    ...row,
    ...pdfFile(row.id),
  };
}

function backendRow(
  id: string,
  hoursAgo: number,
  name: string,
  email: string,
  title: string,
  company: string,
  years: number,
  skills: string[],
  focus: string,
  location: string,
  score: number,
  reason: string,
  status: StoredSubmission["status"] = "pending"
): SeedRow {
  return {
    id,
    roleId: ROLE_BACKEND,
    candidateName: name,
    candidateEmail: email,
    candidatePhone: null,
    currentTitle: title,
    currentCompany: company,
    yearsExperience: years,
    highlySkilledAt: focus,
    location,
    skills,
    matchScore: score,
    matchScoreReason: reason,
    aiSummary: `${title} at ${company}. ${years} years. Strong ${focus.toLowerCase()} profile.`,
    status,
    parseStatus: "done",
    parseError: null,
    rawText: `${name}\n${title} at ${company}\n${skills.join(", ")}`,
    createdAt: at(hoursAgo),
  };
}

function createSeed(): Store {
  const store = emptyStore();

  const roles: StoredRole[] = [
    {
      id: ROLE_BACKEND,
      ownerId: MOCK_OWNER.id,
      title: "Senior Backend Engineer",
      companyName: "Razorpay",
      slug: "senior-backend-engineer-x7k2m9",
      description:
        "We're hiring a Senior Backend Engineer to work on payments APIs. 5+ years with Go or Java, Postgres, and distributed systems.",
      isOpen: true,
      createdAt: at(24 * 40),
      submissionCount: 0,
    },
    {
      id: ROLE_FULLSTACK,
      ownerId: MOCK_OWNER.id,
      title: "Hiring fullstack engineers",
      companyName: null,
      slug: "hiring-fullstack-engineers-k4n8p2",
      description:
        "Looking for fullstack engineers who can move across React, Node, and product work without dropping the quality of either side.",
      isOpen: true,
      createdAt: at(24 * 20),
      submissionCount: 0,
    },
    {
      id: ROLE_DESIGNER,
      ownerId: MOCK_OWNER.id,
      title: "Product Designer",
      companyName: "Grab",
      slug: "product-designer-m3q9t1",
      description:
        "Own the hiring experience for consumer apps — research, flows, and a polished visual system across web and mobile.",
      isOpen: false,
      createdAt: at(24 * 60),
      submissionCount: 0,
    },
  ];

  for (const role of roles) store.roles.set(role.id, role);

  const backend: SeedRow[] = [
    {
      ...backendRow(
        "sub_priya",
        2,
        "Priya Sharma",
        "priya@gmail.com",
        "Senior Backend Engineer",
        "Razorpay",
        6,
        ["Go", "Postgres", "Kafka", "gRPC"],
        "Backend",
        "Bangalore",
        88,
        "Strong overlap with payments APIs, Go, and distributed systems in the role description."
      ),
      candidatePhone: "+91 98765 43210",
      aiSummary:
        "Backend engineer at Razorpay focused on payments APIs. Strong Go / Postgres / Kafka. 6 years, Bangalore. Close match for the role’s distributed-systems requirement.",
    },
    backendRow(
      "sub_marcus",
      22,
      "Marcus Chen",
      "marcus.chen@stripe.com",
      "Staff Engineer",
      "Stripe",
      9,
      ["Java", "Kubernetes"],
      "Fullstack",
      "Singapore",
      92,
      "Deep distributed-systems background; slightly broader than the backend-only description.",
      "shortlisted"
    ),
    {
      id: "sub_aisha",
      roleId: ROLE_BACKEND,
      candidateName: "Aisha Rahman",
      candidateEmail: "aisha.r@hey.com",
      candidatePhone: null,
      currentTitle: null,
      currentCompany: null,
      yearsExperience: null,
      highlySkilledAt: null,
      location: null,
      skills: [],
      matchScore: null,
      matchScoreReason: null,
      aiSummary: null,
      status: "pending",
      parseStatus: "pending",
      parseError: null,
      rawText: null,
      createdAt: at(0.1),
    },
    backendRow(
      "sub_tom",
      24 * 3,
      "Tom Nguyen",
      "tom.nguyen@email.com",
      "Software Engineer",
      "Grab",
      3,
      ["Node", "React"],
      "Frontend",
      "Ho Chi Minh City",
      64,
      "Frontend-heavy profile; thinner overlap with the Go/Java backend description.",
      "rejected"
    ),
    {
      id: "sub_elena",
      roleId: ROLE_BACKEND,
      candidateName: "Elena Popov",
      candidateEmail: "elena@pm.me",
      candidatePhone: null,
      currentTitle: null,
      currentCompany: null,
      yearsExperience: null,
      highlySkilledAt: null,
      location: null,
      skills: [],
      matchScore: null,
      matchScoreReason: null,
      aiSummary: null,
      status: "pending",
      parseStatus: "failed",
      parseError: "Could not read that file.",
      rawText: null,
      createdAt: at(24 * 4),
    },
    backendRow(
      "sub_kenji",
      24 * 5,
      "Kenji Sato",
      "kenji.sato@gmail.com",
      "Data Engineer",
      "Grab",
      5,
      ["Python", "Spark"],
      "Data",
      "Tokyo",
      58,
      "Strong data stack, but the role description asks for backend services, not pipelines."
    ),
    backendRow(
      "sub_noah",
      24 * 6,
      "Noah Patel",
      "noah.p@email.com",
      "Backend Engineer",
      "GoTo",
      4,
      ["Go", "SQL"],
      "Backend",
      "Jakarta",
      71,
      "Go experience is relevant; less evidence of payments or distributed systems at scale."
    ),
    backendRow(
      "sub_mina",
      24 * 7,
      "Mina Park",
      "mina.park@kakao.com",
      "Senior Engineer",
      "Kakao",
      7,
      ["Java", "Kafka", "Redis"],
      "Backend",
      "Seoul",
      81,
      "Java and Kafka match the stack; payments domain is inferred rather than demonstrated."
    ),
    backendRow(
      "sub_lucas",
      24 * 8,
      "Lucas Meyer",
      "lucas.meyer@email.com",
      "Platform Engineer",
      "Atlassian",
      8,
      ["Go", "Kubernetes", "Postgres"],
      "Backend",
      "Sydney",
      84,
      "Platform and Postgres background maps cleanly onto the distributed-systems requirement."
    ),
    backendRow(
      "sub_anya",
      24 * 9,
      "Anya Iyer",
      "anya.iyer@email.com",
      "Software Engineer",
      "CRED",
      5,
      ["Java", "Postgres"],
      "Backend",
      "Bangalore",
      76,
      "Fintech backend work is close; a bit light on Go and high-scale messaging."
    ),
    backendRow(
      "sub_wei",
      24 * 10,
      "Wei Tan",
      "wei.tan@email.com",
      "Staff Backend Engineer",
      "Shopee",
      10,
      ["Go", "gRPC", "Postgres"],
      "Backend",
      "Singapore",
      90,
      "Long-running Go services and gRPC at marketplace scale match the role closely."
    ),
    backendRow(
      "sub_sara",
      24 * 11,
      "Sara Lindqvist",
      "sara.l@email.com",
      "Backend Engineer",
      "Klarna",
      6,
      ["Java", "Kafka"],
      "Backend",
      "Stockholm",
      86,
      "Payments experience plus Java/Kafka is a direct overlap with the description."
    ),
    backendRow(
      "sub_ravi",
      24 * 12,
      "Ravi Mehta",
      "ravi.mehta@email.com",
      "SDE II",
      "Amazon",
      4,
      ["Java", "DynamoDB"],
      "Backend",
      "Hyderabad",
      69,
      "Solid backend fundamentals; less Postgres and payments-API evidence."
    ),
    backendRow(
      "sub_hana",
      24 * 13,
      "Hana Kim",
      "hana.kim@email.com",
      "Software Engineer",
      "Naver",
      3,
      ["Go", "Redis"],
      "Backend",
      "Seoul",
      62,
      "Go is present but years of experience sit under the 5+ bar."
    ),
    backendRow(
      "sub_omar",
      24 * 14,
      "Omar Haddad",
      "omar.h@email.com",
      "Senior Software Engineer",
      "Careem",
      7,
      ["Java", "Postgres", "gRPC"],
      "Backend",
      "Dubai",
      80,
      "Senior Java services with Postgres; payments domain is adjacent rather than core."
    ),
    backendRow(
      "sub_jade",
      24 * 15,
      "Jade Santos",
      "jade.santos@email.com",
      "Backend Engineer",
      "Nubank",
      5,
      ["Kotlin", "Kafka", "Postgres"],
      "Backend",
      "Sao Paulo",
      83,
      "Fintech backend and Kafka/Postgres are a strong match even without Go."
    ),
    backendRow(
      "sub_theo",
      24 * 16,
      "Theo Laurent",
      "theo.l@email.com",
      "Platform Engineer",
      "Datadog",
      6,
      ["Go", "Kubernetes"],
      "Backend",
      "Paris",
      77,
      "Go and systems work are there; less product-API and Postgres depth."
    ),
    backendRow(
      "sub_leila",
      24 * 17,
      "Leila Hassan",
      "leila.h@email.com",
      "Senior Backend Engineer",
      "Talabat",
      8,
      ["Java", "Postgres"],
      "Backend",
      "Dubai",
      79,
      "Senior Java/Postgres profile; distributed-systems examples are thinner."
    ),
    backendRow(
      "sub_ben",
      24 * 18,
      "Ben Walker",
      "ben.walker@email.com",
      "Software Engineer",
      "Wise",
      4,
      ["Go", "Postgres"],
      "Backend",
      "London",
      74,
      "Payments-adjacent Go/Postgres work, a year under the stated experience bar."
    ),
    backendRow(
      "sub_yara",
      24 * 19,
      "Yara Costa",
      "yara.costa@email.com",
      "Backend Engineer",
      "iFood",
      5,
      ["Java", "Redis", "Postgres"],
      "Backend",
      "Sao Paulo",
      72,
      "Solid service work; less evidence of high-scale messaging."
    ),
    backendRow(
      "sub_nikhil",
      24 * 20,
      "Nikhil Rao",
      "nikhil.rao@email.com",
      "Staff Engineer",
      "PhonePe",
      11,
      ["Java", "Kafka", "Postgres"],
      "Backend",
      "Bangalore",
      93,
      "Payments infrastructure at scale is the closest match in the pile."
    ),
    backendRow(
      "sub_claire",
      24 * 21,
      "Claire Dubois",
      "claire.d@email.com",
      "Software Engineer",
      "Adyen",
      5,
      ["Java", "Go"],
      "Backend",
      "Amsterdam",
      85,
      "Payments APIs plus both Java and Go cover the description almost verbatim."
    ),
    backendRow(
      "sub_arjun",
      24 * 22,
      "Arjun Desai",
      "arjun.desai@email.com",
      "Backend Engineer",
      "Zerodha",
      6,
      ["Go", "Postgres"],
      "Backend",
      "Bangalore",
      78,
      "Fintech Go/Postgres; distributed-systems scope is more mid than senior."
    ),
    backendRow(
      "sub_mei",
      24 * 23,
      "Mei Chen",
      "mei.chen@email.com",
      "Senior Engineer",
      "Sea",
      7,
      ["Java", "Kubernetes"],
      "Fullstack",
      "Singapore",
      70,
      "Strong engineer, broader than the backend-only description."
    ),
    backendRow(
      "sub_felix",
      24 * 24,
      "Felix Brown",
      "felix.brown@email.com",
      "Software Engineer",
      "Canva",
      3,
      ["Node", "Postgres"],
      "Fullstack",
      "Sydney",
      55,
      "Younger fullstack profile with little overlap on Go/Java services.",
      "rejected"
    ),
  ];

  const fullstack: SeedRow[] = [
    backendRow(
      "sub_fs_1",
      10,
      "Amelia Brooks",
      "amelia.b@email.com",
      "Fullstack Engineer",
      "Canva",
      5,
      ["React", "Node"],
      "Fullstack",
      "Sydney",
      80,
      "Comfortable on both sides of the stack."
    ),
    backendRow(
      "sub_fs_2",
      30,
      "Diego Alvarez",
      "diego.a@email.com",
      "Product Engineer",
      "Linear",
      6,
      ["React", "TypeScript"],
      "Frontend",
      "Remote",
      74,
      "Product-minded; Node depth is lighter."
    ),
    backendRow(
      "sub_fs_3",
      50,
      "Sofia Berg",
      "sofia.berg@email.com",
      "Fullstack Engineer",
      "Spotify",
      4,
      ["React", "Node", "Postgres"],
      "Fullstack",
      "Stockholm",
      82,
      "Balanced React/Node profile."
    ),
  ].map((row) => ({
    ...row,
    roleId: ROLE_FULLSTACK,
    matchScore: row.matchScore,
  }));

  const designer: SeedRow[] = [
    {
      id: "sub_ds_1",
      roleId: ROLE_DESIGNER,
      candidateName: "Lana Ortiz",
      candidateEmail: "lana.ortiz@email.com",
      candidatePhone: null,
      currentTitle: "Product Designer",
      currentCompany: "Figma",
      yearsExperience: 6,
      highlySkilledAt: "Product",
      location: "New York",
      skills: ["Figma", "Research"],
      matchScore: 88,
      matchScoreReason: "End-to-end product design with a strong visual system.",
      aiSummary: "Product designer focused on consumer apps and design systems.",
      status: "shortlisted",
      parseStatus: "done",
      parseError: null,
      rawText: "Lana Ortiz Product Designer Figma",
      createdAt: at(24 * 10),
    },
    {
      id: "sub_ds_2",
      roleId: ROLE_DESIGNER,
      candidateName: "Ibrahim Khan",
      candidateEmail: "ibrahim.k@email.com",
      candidatePhone: null,
      currentTitle: "Product Designer",
      currentCompany: "Grab",
      yearsExperience: 4,
      highlySkilledAt: "Product",
      location: "Singapore",
      skills: ["Figma", "Prototyping"],
      matchScore: 71,
      matchScoreReason: "Relevant marketplace experience; lighter research depth.",
      aiSummary: "Designer on consumer growth surfaces at Grab.",
      status: "pending",
      parseStatus: "done",
      parseError: null,
      rawText: "Ibrahim Khan Product Designer Grab",
      createdAt: at(24 * 18),
    },
  ];

  for (const row of [...backend, ...fullstack, ...designer]) {
    store.submissions.set(row.id, submission(row));
  }

  return store;
}

const SEEDED_SLUGS = {
  backend: "senior-backend-engineer-x7k2m9",
  fullstack: "hiring-fullstack-engineers-k4n8p2",
  designer: "product-designer-m3q9t1",
} as const;

export { createSeed, MOCK_PDF, ROLE_BACKEND, ROLE_DESIGNER, ROLE_FULLSTACK, SEEDED_SLUGS };
