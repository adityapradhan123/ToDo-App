const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors')
const port = 3000
// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(cors({
  origin:"http://127.0.0.1:5500",
  credentials:true

}))
//display the todo list
app.get('/', (req, res) => {
  fs.readFile("todo.json","utf-8",(err,data)=>{
    if(err) throw err
    const todos = JSON.parse(data)
    console.log(todos);
    res.json(todos);
  })
}) 
// add a new todo
app.post('/',(req,res)=>{
  // const {title,description}=req.body
  const name =req.body
  // const newData={
  //   id:Math.floor(Math.random()*1000),
  //   title:title,
  //   description:description 
  // }
  console.log(name);
  
  fs.readFile("todo.json","utf-8",(err,data)=>{
    if(err) throw err
    const todo=JSON.parse(data)
 
    todo.push(newData)
    fs.writeFile("todo.json",JSON.stringify(todo), (err)=>{
      if(err) throw err
      res.status(201).json(newData)
    })
  })
})
// delete the todo by id
app.delete('/:id',(req,res)=>{
  fs.readFile("todo.json","utf-8",(err,data)=>{
    if(err) throw err
    const id = parseInt(req.params.id)
    const todo = JSON.parse(data)
    const updatedTodo = todo.filter( todo => todo.id !== id)
    fs.writeFile("todo.json", JSON.stringify(updatedTodo), (err) => {
      if(err) throw err
      res.status(201).send(updatedTodo)
    })
  })
})

//update the todo by id
app.put('/:id',(req,res)=>{
  fs.readFile("todo.json","utf-8",(err,data)=>{
    if(err) throw err
    const id = parseInt(req.params.id)
    const todo = JSON.parse(data)
    const index = todo.findIndex(todo => todo.id === id)
    if(index === -1){
      return res.status(404).send("Todo not found")
    }
    todo[index].title = req.body.title
    todo[index].description = req.body.description
    fs.writeFile("todo.json", JSON.stringify(todo), (err) => {
      if(err) throw err
      res.status(201).json(todo[index])
    })
  })
})


app.use((req,res,next)=>{
  next();
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})