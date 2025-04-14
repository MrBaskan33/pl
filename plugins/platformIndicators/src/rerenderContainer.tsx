import { General } from "@vendetta/ui/components"
import React, { useState, useEffect } from "react"
const { Text,View } = General

const RerenderContainer = ({ children }) => {
  const [counter, setCounter] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCounter(prevCounter => prevCounter + 1)
    }, 2000)
    return () => {
      clearInterval(interval)
    }
  }, [])

  return (
    React.Children.map(children, (child, index) => {
      return React.cloneElement(child, { key: `${index}-${counter}` })
    })
  )
}

export default RerenderContainer
