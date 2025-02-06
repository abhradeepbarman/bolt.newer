/* 
* Parse input XML and convert it to steps
* Eg - Input 
* <boltArtifact id="simple-todo-app" title="Simple Todo App">
    <boltAction type="file" filePath="src/App.tsx">
        import { useState } from 'react';
    </boltAction>
    <boltAction type="shell">
        npm run dev
    </boltAction>
</boltArtifact>
* Output ->
   [{
    title: "Project Files",
    type: CreateFile | CreateFolder | EditFile | DeleteFile | RunScript
    status: pending | in-progress | completed, 
    code: import { useState } from 'react';
   }] 
*/
