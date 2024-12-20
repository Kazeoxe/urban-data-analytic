import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerRoot,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface DrawerComponentProps {
  children: ReactNode;
}

const DrawerComponent = ({ children }: DrawerComponentProps) => {
  return (
    <DrawerRoot placement="start" size="sm">
      <DrawerBackdrop bg="transparent"/>
      <DrawerTrigger asChild>
        <Button
          variant="solid"
          size="sm"
          bg="gray.800"
          color="white"
          _hover={{ bg: "gray.700" }}
          _active={{ bg: "gray.900" }}
          px="4"
          py="2"
        >
          Options
        </Button>
      </DrawerTrigger>
      <DrawerContent boxShadow="none">
        <DrawerHeader>
          <DrawerTitle></DrawerTitle>
        </DrawerHeader>
        <DrawerBody py={12} bg="#F2EEED">
          {children}
        </DrawerBody>
        <DrawerCloseTrigger color="black" />
      </DrawerContent>
    </DrawerRoot>
  );
};

export default DrawerComponent;
