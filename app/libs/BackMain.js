const ipcMain = require("electron").ipcMain,
  cheerio = require("cheerio"),
  xlsx = require("node-xlsx"),
  fs = require("fs");
//读取文件内容
const dialog = require("electron").dialog;

const BackMain = {
  start: function() {
     
   
    ipcMain.on("openDialog", function(event, key) {
      {
        
        dialog.showOpenDialog(
          {
            properties: ["openFile"]
          },
          function(files) {
            if (files) {
              event.sender.send("openDialogCB", files); 
            }
          }
        );
      }
    }); 
  }
};

   

module.exports = BackMain;
