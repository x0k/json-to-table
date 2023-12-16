import { useEffect, useState } from "react";
import { useToast } from "@chakra-ui/react";

export interface HTMLTablePageProps {
  content: Promise<string>;
}

export function HTMLTablePage({ content }: HTMLTablePageProps) {
  const toast = useToast();
  const [table, setTable] = useState("");
  useEffect(() => {
    content.then(setTable).catch((e) => {
      toast({
        title: "Error",
        description: String(e),
        status: "error",
      });
    });
  }, [content]);
  return <iframe style={{ width: "100%", height: "100vh" }} srcDoc={table} />;
}
