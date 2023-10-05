//
//  FisaJS a lib to access user 
//  file system with JS in Browser.
//  
//  License: WL
//  WL: Without license.
//


var FISAFile = function(FisaObject,handle,isRoot){
    var self = this;
    self.handle = handle;

    if(isRoot){
        self.folder = "root";
        self.path = ["root"];
    }
    
    var FisaPath = FisaObject;

    self.getName = function(){
        return self.handle.name;
    }
    self.getType = function(){
        return "file";
    }
    self.getSize = async function(){
        var file = await self.handle.getFile();
        return file.size;
    }
    self.getParent = function(){
        return self.folder;
    }
    self.getPath = function(){
        return self.path;
    }
    self.getExtensions = function(){
        return self.getName().split(".");
    }
    self.delete = function(type){
        var textError = `This file cannot be removed.`;

        if(type == 0 || type == undefined){
            self.handle.remove();
        }else{
            type == 1
                ? self.folder.handle.removeEntry(self.getName())
                : console.error(textError);
        }
    }
    self.rename = function(name,type){
        if(type == 0 || type == undefined){
            self.handle.move(name);
        }else if(type == 1){
            var movedFile = self;

            self.buffer().then(async function(result){
                movedFile.delete(1);

                var mainFolder = await movedFile.folder;
                var newFile = await mainFolder.getFileHandle(name,{create:true});

                var write = await newFile.createWritable();
                await write.write(FisaPath.bufferObject.handle);
                await write.close();
            });
        }
    }
    self.move = function(folder,type){
        if(type == 0 || type == undefined){
            self.handle.move(folder.handle);
        }else if(type == 1){
            var movedFile = self;

            self.buffer().then(function(result){
                movedFile.delete(1);
                folder.place();
            });
        }
    }
    self.buffer = async function(){
        var thisFile = await self.handle.getFile();

        var content = await thisFile.arrayBuffer();
        FisaPath.bufferObject = {handle:content,folder:"root",path:["root"],name:this.getName(),type:this.getType()};
    }
    self.copy = async function(){
        var thisFile = await self.handle.getFile();

        var content = await thisFile.arrayBuffer();
        FisaPath.copyObject = {handle:content,folder:"root",path:["root"],name:this.getName(),type:this.getType()};
    }
    self.cut = function(type){
        var cutFile = self;

        self.copy().then(function(result){
            cutFile.delete(type);
        });
    }
    self.write = async function(content){
        var write = await self.handle.createWritable();
        await write.write(content);
        await write.close();
    }
    self.read = async function(){
        return await self.handle.getFile();
    }
    self.save = async function(options){
        var thisFile = await self.handle.getFile();
        var content = await thisFile.arrayBuffer();

        var newFile = await window.showSaveFilePicker(options ?? {});

        var write = await newFile.createWritable();
        await write.write(content);
        await write.close();
    }
    self.download = async function(name){
        self.read().then(function(result){
            var link = document.createElement("a");

            link.download = name === undefined ? self.getName() : name;
            link.href = URL.createObjectURL(result);

            link.click();
            link.remove();
        });
    }
}

var FISAFolder = function(FisaObject,handle,isRoot){
    var self = this;
    self.handle = handle;
    self.entries = [];

    if(isRoot){
        self.folder = "root";
        self.path = ["root"];
    }
    
    var FisaPath = FisaObject;

    self.getName = function(){
        return self.handle.name;
    }
    self.getType = function(){
        return "folder";
    }
    self.getSize = async function(){
        FisaPath.bufferSize = 0;
        return await FisaPath.measureFolder(self);
    }
    self.getParent = function(){
        return self.folder;
    }
    self.getPath = function(){
        return self.path;
    }
    self.delete = function(type){
        var textError = `This folder cannot be removed`;

        if(type == 0 || type == undefined){
            self.handle.remove();
        }else{
            type == 1
                ? self.folder.handle.removeEntry(self.name,{recursive:true})
                : console.error(textError);
        }
    }
    self.cut = function(type){
        var cutFolder = self;

        self.copy().then(function(){
            cutFolder.delete(type);
        });
    }
    self.copy = async function(){
        FisaPath.copyObject = {
            handle:"virtual",
            folder:"root",
            path:["root"],
            name:self.getName(),
            type:self.getType(),
            entries:await FisaPath.copyFolder(self.handle)
        };
    }
    self.paste = async function(name){
        if(FisaPath.copyObject.type == "folder"){
            var mainFolder = await self.handle.getDirectoryHandle(
                name == undefined ? `${FisaPath.copyObject.name} (copy)` : name,
                {create:true}
            );

            await FisaPath.pasteFolder(self,FisaPath.copyObject);
        }else{
            var mainFolder = await self.handle;
            var newFile = await mainFolder.getFileHandle(FisaPath.copyObject.name,{create:true});

            var write = await newFile.createWritable();
            await write.write(FisaPath.copyObject.handle);
            await write.close();
        }
    }
    self.buffer = async function(){
        FisaPath.bufferObject = {
            handle:"virtual",
            folder:"root",
            path:["root"],
            name:self.getName(),
            type:self.getType(),
            entries:await FisaPath.copyFolder(self.handle)
        };
    }
    self.place = async function(){
        if(FisaPath.bufferObject.type == "folder"){
            var mainFolder = await self.handle.getDirectoryHandle(FisaPath.bufferObject.name,{create:true});
            await FisaPath.pasteFolder(mainFolder,FisaPath.bufferObject);
        }else{
            var mainFolder = await self.handle;

            var newFile = await mainFolder.getFileHandle(FisaPath.bufferObject.name,{create:true});
            var write = await newFile.createWritable();
            await write.write(FisaPath.bufferObject.handle);
            await write.close();
        }
    }
    self.rename = async function(name,type){
        if(type == 0 || type == undefined){
            self.handle.move(name);
        }else if(type == 1){
            var movedFolder = self; 

            self.buffer().then(async function(){
                movedFolder.delete(1);

                var mainFolder = await movedFolder.folder.getDirectoryHandle(name,{create:true});
                await FisaPath.pasteFolder(mainFolder,FisaPath.bufferObject);
            });
        }
    }
    self.update = async function(){
        self.entries = [];

        self.entries = await FisaPath.scanFolder(self.handle);
        await FisaPath.fillFolder(self);
    }
    self.newFolder = async function(name){
        var textError = `This folder cannot create folders`;

        if(name == undefined){
            return console.error(textError);
        }

        await self.handle.getDirectoryHandle(name,{create:true});
    }
    self.newFile = async function(name,content){
        var textError = `This folder cannot create files`;

        if(name == undefined || content == undefined){
            return console.error(textError);
        }

        var newFile = await self.handle.getFileHandle(name,{create:true});

        var write = await newFile.createWritable();
        await write.write(content);
        await write.close();
    }
    self.move = function(folder,type){
        if(type == 0 || type == undefined){
            self.handle.move(folder.handle);
        }else if(type == 1){
            var movedFolder = self;

            self.buffer().then(function(result){
                movedFolder.delete(1);
                folder.place();
            });
        }
    }
    self.save = async function(options){
        var parentFolder = await FisaPath.openFolder(options);

        var thisFolder = await self.buffer();
        parentFolder.place();
    }
}

var Fisa = function(){
    var self = this;

    self.objectSize = 0;
    self.bufferObject = {};
    self.copyObject = {};

    self.openFile = async function(options){
        var currentFile = await window.showOpenFilePicker(options ?? {});
        var openFiles = [];

        if(currentFile.length > 1){
            for(var index in currentFile){
                openFiles.push(new FISAFile(self,currentFile[index],true));
            }
            return openFiles;
        }else{
            return new FISAFile(self,currentFile[0],true);
        }
    }
    self.openFolder = async function(options){        
        var thisFolder = await window.showDirectoryPicker(options ?? {});

        var folderObject = new FISAFolder(self,thisFolder,true);
        folderObject.entries = await self.scanFolder(thisFolder);
                               await self.fillFolder(folderObject);

        return folderObject;
    }
    self.pasteFolder = async function(folder,entries){
        for(var index in entries.entries){
            if(entries.entries[index].getType() === "folder"){
                var subFolder = await folder.getDirectoryHandle(entries.entries[index].getName(),{create:true});

                await self.pasteFolder(subFolder,entries.entries[index]);
            }else if(entries.entries[index].getType() === "file"){
                var newFile = await folder.getFileHandle(entries.entries[index].getName(),{create:true});

                var write = await newFile.createWritable();
                await write.write(entries.entries[index].handle);
                await write.close();
            }
        }
    }
    self.copyFolder = async function(folder){
        var entries = [];

        for await(var [name,handle] of folder){
            if(handle.kind === "directory"){
                entries.push({
                    handle:"virtual",
                    folder:folder.name,
                    name:name,
                    type:"folder",
                    entries:await self.copyFolder(handle)
                });
            }else if(handle.kind === "file"){
                var file = await handle.getFile();
                var content = await file.arrayBuffer();

                entries.push({
                    handle:content,
                    folder:folder.name,
                    name:name,
                    type:"file"
                });
            }
        }
        return entries;
    }
    self.scanFolder = async function(folder){
        var entries = [];

        for await(var [name,handle] of folder){
            if(handle.kind === "directory"){
                var folderObject = new FISAFolder(self,handle,false);
                folderObject.entries = await self.scanFolder(handle);

                entries.push(folderObject);
            }else if(handle.kind === "file"){
                entries.push(new FISAFile(self,handle,false));
            }
        }
        return entries;
    }
    self.fillFolder = async function(folder){
        for(var index in folder.entries){
            if(folder.entries[index].handle.kind === "directory"){
                folder.entries[index].folder = folder;
                folder.entries[index].path = [...folder.path,folder];

                await self.fillFolder(folder.entries[index]);
            }else if(folder.entries[index].handle.kind === "file"){
                folder.entries[index].folder = folder;
                folder.entries[index].path = [...folder.path,folder];
            }
        }
    }
    self.measureFolder = async function(folder){
        for(var index in folder.entries){
            if(folder.entries[index].handle.kind === "directory"){
                await self.measureFolder(folder.entries[index]);
            }else if(folder.entries[index].handle.kind === "file"){
                var file = await folder.entries[index].handle.getFile();
                self.objectSize += file.size;
            }
        }
        return self.objectSize;
    }
}