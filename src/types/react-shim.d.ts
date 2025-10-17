declare module 'react' {
  export type FC<P = {}> = (props: P & { children?: any }) => any
  export function useState<S>(initial: S | (() => S)): [S, (value: S | ((prev: S) => S)) => void]
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void
  export function useMemo<T>(factory: () => T, deps: any[]): T
  export function useRef<T>(value: T): { current: T }
  export type CSSProperties = Record<string, any>
  export const Fragment: any
}

declare module 'react/jsx-runtime' {
  export const jsx: any
  export const jsxs: any
  export const Fragment: any
}
