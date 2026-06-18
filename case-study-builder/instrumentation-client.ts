/* eslint-disable no-extend-native, @typescript-eslint/unbound-method */
/**
 * Browser-translation compatibility guard.
 *
 * Page translators (Google Translate / Chrome auto-translate) rewrite the DOM:
 * they wrap text nodes in <font> elements and physically relocate them. React
 * keeps references to the original nodes; when it later removes or reorders them
 * during its commit phase it calls parent.removeChild(node) /
 * parent.insertBefore(node, ref) against a node the translator has already
 * reparented, and the browser throws:
 *
 *   NotFoundError: Failed to execute 'removeChild' on 'Node':
 *   The node to be removed is not a child of this node.
 *
 * That uncaught error trips the nearest error boundary — for the case-study
 * wizard that is app/dashboard/error.tsx, which renders "Dashboard Error"
 * (machine-translated for the affected user). It is not a data/server bug; the
 * page works for anyone not running page translation.
 *
 * These defensive guards make removeChild/insertBefore tolerant of a node a
 * translator moved: they operate on the node's ACTUAL parent (or no-op) instead
 * of throwing. Translation keeps working for the user; React stops crashing.
 *
 * This is the widely-used remedy for the well-known React + browser-translation
 * interaction. It runs once, before the app hydrates, via Next.js's
 * instrumentation-client entrypoint, so the guards are in place before React's
 * first commit.
 */
if (typeof Node !== 'undefined' && typeof window !== 'undefined') {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function removeChild<T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) {
      // A translator moved `child` under a different parent. Remove it from its
      // real parent if it still has one; otherwise it is already detached.
      if (child.parentNode) {
        return child.parentNode.removeChild(child);
      }
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  } as typeof Node.prototype.removeChild;

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function insertBefore<T extends Node>(
    this: Node,
    newNode: T,
    referenceNode: Node | null,
  ): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      // The reference node was relocated by a translator; appending keeps the
      // new node in the tree instead of throwing.
      return this.appendChild(newNode) as T;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  } as typeof Node.prototype.insertBefore;
}
