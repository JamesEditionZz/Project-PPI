"use client";
import Image from "next/image";
import Index from "./components/Header/page";
import { useEffect, useState } from "react";
import React from "react";

export default function Home() {
  const [logo, setLogo] = useState(false);
  const [PageData, setPageData] = React.useState<any>(0);
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

  const filterText = async (text: string) => {
    if (text === "") {
      const res = await fetch("http://192.168.10.23:5005/API/Product");
      const data = await res.json();

      setGetData(data);
    } else {
      const filtered = GetData.filter((item: any) =>
        item?.Product_name?.includes(text),
      );
      setGetData(filtered);
    }
  };

  return (
    <>
      <Index />
    </>
  );
}
