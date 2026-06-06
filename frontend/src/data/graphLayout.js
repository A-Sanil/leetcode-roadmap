// Node positions and edges for the tree/roadmap view.
// Coordinate system: 1000 x 820 logical pixels (scaled to viewport at render time).
// x, y = top-left corner of the node box.
export const NODE_W = 140
export const NODE_H = 48
export const VB_W = 1000
export const VB_H = 820

export const nodeLayout = {
  'arrays-hashing':   { x: 430, y: 10  },
  'two-pointers':     { x: 200, y: 110 },
  'stack':            { x: 660, y: 110 },
  'binary-search':    { x: 60,  y: 215 },
  'sliding-window':   { x: 360, y: 215 },
  'linked-list':      { x: 660, y: 215 },
  'trees':            { x: 360, y: 320 },
  'tries':            { x: 125, y: 425 },
  'backtracking':     { x: 630, y: 425 },
  'heap':             { x: 170, y: 530 },
  'graphs':           { x: 430, y: 530 },
  'dp-1d':            { x: 710, y: 530 },
  'intervals':        { x: 5,   y: 635 },
  'greedy':           { x: 185, y: 635 },
  'advanced-graphs':  { x: 375, y: 635 },
  'dp-2d':            { x: 555, y: 635 },
  'bit-manipulation': { x: 740, y: 635 },
  'math-geometry':    { x: 430, y: 742 },
}

// [source, target] — arrow points from source bottom → target top
export const edges = [
  ['arrays-hashing', 'two-pointers'],
  ['arrays-hashing', 'stack'],
  ['two-pointers', 'binary-search'],
  ['two-pointers', 'sliding-window'],
  ['stack', 'sliding-window'],
  ['stack', 'linked-list'],
  ['binary-search', 'trees'],
  ['sliding-window', 'trees'],
  ['linked-list', 'trees'],
  ['trees', 'tries'],
  ['trees', 'backtracking'],
  ['tries', 'heap'],
  ['backtracking', 'heap'],
  ['backtracking', 'graphs'],
  ['backtracking', 'dp-1d'],
  ['heap', 'intervals'],
  ['heap', 'greedy'],
  ['heap', 'advanced-graphs'],
  ['graphs', 'advanced-graphs'],
  ['graphs', 'dp-2d'],
  ['dp-1d', 'dp-2d'],
  ['dp-1d', 'bit-manipulation'],
  ['dp-2d', 'math-geometry'],
  ['advanced-graphs', 'math-geometry'],
]
