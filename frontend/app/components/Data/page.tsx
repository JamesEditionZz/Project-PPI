"use client";
import Image from "next/image";
import React, { useEffect } from "react";

export default function page() {
  const [GetData, setGetData] = React.useState<any>([]);
  const myLoader = ({ src }: { src: string }) => src;

  useEffect(() => {
    const datafecth = async () => {
      const res = await fetch("http://192.168.10.23:5005/API/Product");
      const data = await res.json();

      setGetData(data);
    };
    datafecth();
  }, []);

  return (
    <>
      
    </>
  );
}
