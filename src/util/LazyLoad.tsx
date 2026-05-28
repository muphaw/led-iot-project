import { Suspense, type ComponentProps, type ElementType } from "react";

type LazyloadProps<T extends ElementType>=({
    Component : ElementType
} & ComponentProps<T>)

const Lazyload = <T extends ElementType>({
    Component: Component,
    ...props
} : LazyloadProps<T>) =>{
    return (
        <Suspense fallback={<div>Loading....</div>}>
            <Component {...props}/>
        </Suspense>
    )
}

export default Lazyload