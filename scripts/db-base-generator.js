const fs = require("fs");
const path = require("path");

const [, , type, name] = process.argv;

if (!type || (type !== "db" && type !== "master" && type !== "module")) {
  console.error("Please provide a valid type (db, master, module) and name for the generator.");
  process.exit(1);
}

if(type === "db") {
  const basePath = path.join(process.cwd(), "src", "database", name);
   generateDbFiles(name, basePath);
}

if(type === "master") {
  const basePath = path.join(process.env.INIT_CWD, name);
  generateMasterFiles(name, basePath);
}

if(type === "module") {
  const basePath = path.join(process.env.INIT_CWD, name);
  generateModuleFiles(name, basePath);
}

function generateDbFiles(name, basePath) {
  const files = [
    `${name}-db-model.ts`,
    `${name}-db-interface.ts`,
  ];

  fs.mkdirSync(basePath, { recursive: true });

  files.forEach((file) => {
    fs.writeFileSync(path.join(basePath, file), "");
  });
}

function generateMasterFiles(name, basePath) {
 const folders = [
   "services",
   "dto",
   "payloads",
   "__tests__",
   "interfaces",
   "helpers",
   "helpers/validators",
   "workflow",
 ];
 
 const files = [
   `${name}.controller.ts`,
   `${name}.validator.ts`,
   `${name}.routes.ts`,
   `${name}.response.ts`,
   `${name}.messages.ts`,
   `${name}.helper.ts`,
   `services/create-${name}.service.ts`,
   `services/show-${name}.service.ts`,
   `services/delete-${name}.service.ts`,
   `services/update-${name}.service.ts`,
   `services/list-${name}.service.ts`,
   `services/enable-${name}.service.ts`,
   `services/disable-${name}.service.ts`,
 ];
 
 fs.mkdirSync(basePath, { recursive: true });
 
 folders.forEach((folder) => {
   fs.mkdirSync(path.join(basePath, folder), {
     recursive: true,
   });
 });
 
 files.forEach((file) => {
   fs.writeFileSync(path.join(basePath, file), "");
 });
}

function generateModuleFiles(name, basePath) {
  const folders = [
    "services",
    "dto",
    "payloads",
    "__tests__",
    "interfaces",
    "helpers",
    "helpers/validators",
    "workflow",
  ];
  
  const files = [
    `${name}.controller.ts`,
    `${name}.validator.ts`,
    `${name}.routes.ts`,
    `${name}.response.ts`,
    `${name}.messages.ts`,
    `${name}.helper.ts`,
  ];
  
  fs.mkdirSync(basePath, { recursive: true });
  
  folders.forEach((folder) => {
    fs.mkdirSync(path.join(basePath, folder), {
      recursive: true,
    });
  });
  
  files.forEach((file) => {
    fs.writeFileSync(path.join(basePath, file), "");
  });
}
