const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const fs = require('fs');

const port = 3000
app.use(bodyParser.json());
app.get('/', (req, res) => {
  fs.readFile("todo.json","utf-8",(err,data)=>{
    if(err) throw err
    const todos = JSON.parse(data)
    console.log(todos);
    res.json(todos)
  })
}) 

app.post('/',(req,res)=>{
  const newData={
   id:ctr++,
   title:req.body.title,
   description:req.body.description 
  }
  fs.readFile("todo.json","utf-8",(err,data)=>{
    const todo=JSON.parse(data)
 
    todo.push(newData)
    fs.writeFile("todo.json",JSON.stringify(data), (err)=>{
      if(err) throw err
      res.status(201).json(todo)

    })
  })
})
app.use((req,res,next)=>{
  next();
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})