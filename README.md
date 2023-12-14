# [Fisa](# "File System Access" )
Library to access user file system with Javascript in browser

## How open a Folder
```javascript
var folder;
new Fisa().openFolder().then(function(result){
  folder = result;
})
```

## How open a File
```javascript
var file;
new Fisa().openFile().then(function(result){
  file = result;
})
```

## Folder methods
```javascript
folder.getName()
folder.getType()
folder.getSize()
folder.getPath()
folder.getParent()

folder.delete(int mode)

folder.cut(int mode)
folder.copy()
folder.paste(string newName)

folder.catch(int mode)        // Same as *cut* but in buffer
folder.buffer()               // Same as *copy* but dont replace the currently copied folder/file
folder.place(string newName)  // Same as *paste* but in buffer

folder.update()               // Update folder entries

folder.rename(string newName, int mode)
folder.move(FisaFolder parent, int mode)

folder.newFolder(string name)
folder.newFile(string name, data content)

folder.save()
```

## File methods
```javascript
file.getName()
file.getType()
file.getSize()
file.getPath()
file.getParent()
file.getExtensions()          //Example: example.min.js
                              //Returns: ["example","min","js"]

file.delete(int mode)

file.cut(int mode)
file.copy()

file.catch(int mode)        // Same as *cut* but in buffer
file.buffer()               // Same as *copy* but dont replace the currently copied folder/file

file.rename(string newName, int mode)
file.move(FisaFolder parent, int mode)

file.write(data content)
file.read()

file.save()
file.download(string name)
```
