// DevMemory VSCode Extension Test File
// This file is for testing the VSCode extension functionality

function calculateFibonacci(n) {
    if (n <= 1) return n;
    return calculateFibonacci(n - 1) + calculateFibonacci(n - 2);
}

// Example usage
console.log('Fibonacci of 10:', calculateFibonacci(10));

// TODO: Test the extension by:
// 1. Selecting this code snippet
// 2. Using Ctrl+Shift+M to capture it
// 3. Using Ctrl+Shift+F to search for memories
// 4. Using the command palette to access DevMemory commands