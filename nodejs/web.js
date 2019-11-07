var http = require('http');
var fs = require('fs');
const { spawn } = require('child_process');

var squidStatus = "N/A";
var squidActiveStatus = "N/A";
var squidSubStatus = "N/A";
var openPortsLog = "N/A";
var cpuLog = "N/A";
var url = "N/A";

function updateOpenPortsLog() {
  const systemctl = spawn('sudo', ['netstat', '-tulpn', '|', 'grep', 'LISTEN']);

  systemctl.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
    openPortsLog = data.toString().replace('\n', '<br>\n');
  });

  systemctl.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  systemctl.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });
};

function updateCPULog() {
  const systemctl = spawn('sh', ['-c', 'top -n 1 -b -o %CPU | head -n 15']);

  systemctl.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
    cpuLog = data.toString();
  });

  systemctl.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
    cpuLog = data;
  });

  systemctl.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });
};

function updateSquidStatus() {
  const systemctl = spawn('systemctl', ['status', 'squid']);
  // systemctl show -p ActiveState --value squid-status-web
  // systemctl show -p SubState --value squid-status-web

  systemctl.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
    squidStatus = data.toString().replace('\n', '<br>\n');
  });

  systemctl.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  systemctl.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });
};

function updateSquidActiveStatus() {
  const systemctl = spawn('systemctl', ['show', '-p', 'ActiveState', '--value', 'squid']);

  systemctl.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
    squidActiveStatus = data.toString();
  });

  systemctl.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  systemctl.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });
};

function updateSquidSubStatus() {
  const systemctl = spawn('systemctl', ['show', '-p', 'SubState', '--value', 'squid']);

  systemctl.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
    squidSubStatus = data.toString();
  });

  systemctl.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  systemctl.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });
};

function setHtmlValue(html, tag, value) {
  html = html.toString().replace(new RegExp(tag, 'g'), value);
  return html;
}

function parseHtml(html) {
  var parsedHtml = html;
  parsedHtml = setHtmlValue(parsedHtml, "{squidActiveStatus}", squidActiveStatus);
  parsedHtml = setHtmlValue(parsedHtml, "{squidSubStatus}", squidSubStatus);
  parsedHtml = setHtmlValue(parsedHtml, "{squidStatus}", squidStatus);
  parsedHtml = setHtmlValue(parsedHtml, "{openPortsLog}", openPortsLog);
  parsedHtml = setHtmlValue(parsedHtml, "{cpuLog}", cpuLog);
  parsedHtml = setHtmlValue(parsedHtml, "{url}", url);
  return parsedHtml;
}

function writeCss(response) {
  response.writeHead(200, { 'Content-Type': 'text/css' });
  fs.readFile('./css/main.css', null, function (error, css) {
    if (error) {
      response.writeHead(404);
      response.write('file not found');
    } 
    else {
      response.write(css);
    }
    response.end();
  });
}

function writeHtmlPage(response, pagePath) {
  response.writeHead(200, { 'Content-Type': 'text/html' });

  fs.readFile(pagePath, null, function (error, html) {
    if (error) {
      response.writeHead(404);
      response.write('file not found');
    } else {
      response.write(parseHtml(html));
    }
    response.end();
  });
}

function writeSquidHealth(response) {
  if(squidActiveStatus.trim().toLocaleLowerCase() == "inactive" || squidActiveStatus.trim().toLocaleLowerCase() == "deactivating") {
    response.writeHead(503, { 'Content-Type': 'application/json' });
    var jsonStatus = JSON.stringify({ status : "Unavailable"});
    response.end(jsonStatus);
  }
  else {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    var jsonStatus = JSON.stringify({ status : "OK"});
    response.end(jsonStatus);
  }  
}

http.createServer(function (request, response) {
  updateSquidStatus();
  updateSquidActiveStatus();
  updateSquidSubStatus();
  updateOpenPortsLog();
  updateCPULog();
  url = request.url;
  //writeCss(response);

  if(url == '/squid-health')
    writeSquidHealth(response);
  else
    writeHtmlPage(response, './html/index.html');
}).listen(8081);

console.log('Server running at port 8081/');


