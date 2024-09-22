import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const newMaze = (x, y) => {
  const cells = []; // this contains the grid of cells
  for (let i = 0; i < y; i++) {
    const row = []; // this contains the row of cells
    for (let j = 0; j < x; j++) {
      row.push([0, 0, 0, 0]); // each cell is initialized with walls [top, right, bottom, left]
    }
    cells.push(row);
  }

  const unvisited = [];
  for (let i = 0; i < y; i++) {
    const row = [];
    for (let j = 0; j < x; j++) {
      row.push(true); // each cell is marked as unvisited (true) in the begining,
    }
    unvisited.push(row); //added the row to the unvisited array(this corrpsesponds to the item in the row of cells )
  }

  let currentCell = [
    Math.floor(Math.random() * y),
    Math.floor(Math.random() * x),
  ]; // random starting point
  const path = [currentCell];
  unvisited[currentCell[0]][currentCell[1]] = false; //setiing the randomly selected cell as visited
  let visited = 1;
  const totalCells = x * y; // since the while loop has to run until all the cells are visited

  while (visited < totalCells) {
    const neighbors = [
      [currentCell[0] - 1, currentCell[1], 0, 2],
      [currentCell[0], currentCell[1] + 1, 1, 3],
      [currentCell[0] + 1, currentCell[1], 2, 0],
      [currentCell[0], currentCell[1] - 1, 3, 1],
    ].filter(([r, c]) => r >= 0 && r < y && c >= 0 && c < x && unvisited[r][c]);

    if (neighbors.length) {
      const [nextRow, nextCol, currentWall, nextWall] =
        neighbors[Math.floor(Math.random() * neighbors.length)]; // a random neigbor is selected and assigns values to the respective indices on the left
      cells[currentCell[0]][currentCell[1]][currentWall] = 1; //break that particular wall of the current cell that adjoins the next cell
      cells[nextRow][nextCol][nextWall] = 1; //break that particular wall of the next cell that adjoins the "current" cell

      unvisited[nextRow][nextCol] = false;
      visited++;
      currentCell = [nextRow, nextCol];
      path.push(currentCell);
    } else {
      currentCell = path.pop(); // if no neighbor is left then pop and start backtracking
    }
  }

  return cells;
};

const addWall = (scene, position, rotation, material, geometry) => {
  const wall = new THREE.Mesh(geometry, material);
  wall.position.set(...position);
  if (rotation) {
    wall.rotation.y = rotation;
  }
  scene.add(wall);
};

const Maze = () => {
  const mazeRef = useRef();
  const [playerPosition, setPlayerPosition] = useState([0, 0]);
  const size = 10;
  const maze = useRef(newMaze(size, size)).current;

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    mazeRef.current.appendChild(renderer.domElement);

    const wallMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const wallGeometry = new THREE.BoxGeometry(1, 1, 0.1);
    const playerMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const playerGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const goalMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const goalGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);

    maze.forEach((row, r) => {
      
      row.forEach((cell, c) => {
        const [top, right, bottom, left] = cell;
        if (!top)
          addWall(scene, [c, 0.5, r - 0.5], 0, wallMaterial, wallGeometry);
        if (!right)
          addWall(
            scene,
            [c + 0.5, 0.5, r],
            Math.PI / 2,
            wallMaterial,
            wallGeometry
          );
        if (!bottom)
          addWall(scene, [c, 0.5, r + 0.5], 0, wallMaterial, wallGeometry);
        if (!left)
          addWall(
            scene,
            [c - 0.5, 0.5, r],
            Math.PI / 2,
            wallMaterial,
            wallGeometry
          );
      });
    });

    const player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.set(0, 0.25, 0);
    scene.add(player);

    const goal = new THREE.Mesh(goalGeometry, goalMaterial);
    goal.position.set(size - 1, 0.25, size - 1);
    scene.add(goal);

    camera.position.set(size / 2, size, size / 2);
    camera.lookAt(size / 2, 0, size / 2);

    const animate = () => {
      requestAnimationFrame(animate);
      player.position.set(playerPosition[0], 0.25, playerPosition[1]);
      renderer.render(scene, camera);
    };
    animate();

    const handleKeyDown = (event) => {
      const x = playerPosition[0];
      const z = playerPosition[1];

      let newPosition = [...playerPosition];

      if (event.key === "w") newPosition[1] -= 1; // Move up
      if (event.key === "s") newPosition[1] += 1; // Move down
      if (event.key === "a") newPosition[0] -= 1; // Move left
      if (event.key === "d") newPosition[0] += 1; // Move right

      // Check for walls
      const currentCell = maze[Math.floor(z)][Math.floor(x)];
      const isWall = (direction) => {
        if (direction === "top") return currentCell[0] === 0 && z > 0;
        if (direction === "bottom") return currentCell[2] === 0 && z < size - 1;
        if (direction === "left") return currentCell[3] === 0 && x > 0;
        if (direction === "right") return currentCell[1] === 0 && x < size - 1;
        return false;
      };

      if (
        newPosition[0] >= 0 &&
        newPosition[0] < size &&
        newPosition[1] >= 0 &&
        newPosition[1] < size
      ) {
        if (event.key === "w" && isWall("top")) return;
        if (event.key === "s" && isWall("bottom")) return;
        if (event.key === "a" && isWall("left")) return;
        if (event.key === "d" && isWall("right")) return;

        setPlayerPosition(newPosition);
      }

      // Check for goal
      if (newPosition[0] === size - 1 && newPosition[1] === size - 1) {
        alert("Congrats, You reached the goal!");
        setPlayerPosition([0, 0]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      mazeRef.current.removeChild(renderer.domElement);
    };
  }, [playerPosition, size]); // playerPosition

  return <div ref={mazeRef} />;
};

export default Maze;
