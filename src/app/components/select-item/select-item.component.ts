import { Component, OnInit } from '@angular/core';
import {FormControl} from "@angular/forms";
import {FlatTreeControl} from "@angular/cdk/tree";
import {MatTreeFlatDataSource, MatTreeFlattener} from "@angular/material/tree";
import {SelectionModel} from "@angular/cdk/collections";

@Component({
  selector: 'app-select-item',
  templateUrl: './select-item.component.html',
  styleUrls: ['./select-item.component.scss']
})
export class SelectItemComponent implements OnInit {


  nodeSelected = new FormControl();

  items = DATA;

  flatNodeMap = new Map<ItemFlatNode, ItemNode>();

  /** Map from nested node to flattened node. This helps us to keep the same object for selection */
  nestedNodeMap = new Map<ItemNode, ItemFlatNode>();

  /** A selected parent node to be inserted */
  selectedParent: ItemFlatNode | null = null;

  treeControl: FlatTreeControl<ItemFlatNode>;

  treeFlattener: MatTreeFlattener<ItemNode, ItemFlatNode>;

  dataSource: MatTreeFlatDataSource<ItemNode, ItemFlatNode>;

  /** The selection for checklist */
  checklistSelection = new SelectionModel<ItemFlatNode>(true /* multiple */);

  constructor() {
    this.treeFlattener = new MatTreeFlattener(
      this.transformer,
      this.getLevel,
      this.isExpandable,
      this.getChildren,
    );
    this.treeControl = new FlatTreeControl<ItemFlatNode>(this.getLevel, this.isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  }

  ngOnInit(): void {

    this.dataSource.data = this.buildTree(this.items);

  }

  getLevel = (node: ItemFlatNode) => node.level;

  isExpandable = (node: ItemFlatNode) => node.expandable;

  getChildren = (node: ItemNode): ItemNode[] => node.children;

  hasChild = (_: number, _nodeData: ItemFlatNode) => _nodeData.expandable;

  hasNoContent = (_: number, _nodeData: ItemFlatNode) => _nodeData.name === '';

  transformer = (node: ItemNode, level: number) => {
    const existingNode = this.nestedNodeMap.get(node);
    const flatNode =
      existingNode && existingNode.name === node.name ? existingNode : new ItemFlatNode();
    flatNode.name = node.name;
    flatNode.level = level;
    flatNode.id = node.id;
    flatNode.parentId = node.parentId;
    flatNode.expandable = !!node.children?.length;
    this.flatNodeMap.set(flatNode, node);
    this.nestedNodeMap.set(node, flatNode);
    return flatNode;
  };

  /** Whether all the descendants of the node are selected. */
  descendantsAllSelected(node: ItemFlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const descAllSelected =
      descendants.length > 0 &&
      descendants.every(child => {
        return this.checklistSelection.isSelected(child);
      });
    return descAllSelected;
  }

  /** Whether part of the descendants are selected */
  descendantsPartiallySelected(node: ItemFlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const result = descendants.some(child => this.checklistSelection.isSelected(child));
    return result && !this.descendantsAllSelected(node);
  }

  /** Toggle the to-do item selection. Select/deselect all the descendants node */
  itemSelectionToggle(node: ItemFlatNode): void {
    this.checklistSelection.toggle(node);
    const descendants = this.treeControl.getDescendants(node);
    this.checklistSelection.isSelected(node)
      ? this.checklistSelection.select(...descendants)
      : this.checklistSelection.deselect(...descendants);

    // Force update for the parent
    descendants.forEach(child => this.checklistSelection.isSelected(child));
    this.checkAllParentsSelection(node);
  }

  /** Toggle a leaf to-do item selection. Check all the parents to see if they changed */
  leafItemSelectionToggle(node: ItemFlatNode): void {
    this.checklistSelection.toggle(node);
    this.checkAllParentsSelection(node);
  }

  /* Checks all the parents when a leaf node is selected/unselected */
  checkAllParentsSelection(node: ItemFlatNode): void {
    let parent: ItemFlatNode | null = this.getParentNode(node);
    while (parent) {
      this.checkRootNodeSelection(parent);
      parent = this.getParentNode(parent);
    }
  }

  /** Check root node checked state and change it accordingly */
  checkRootNodeSelection(node: ItemFlatNode): void {
    const nodeSelected = this.checklistSelection.isSelected(node);
    const descendants = this.treeControl.getDescendants(node);
    const descAllSelected =
      descendants.length > 0 &&
      descendants.every(child => {
        return this.checklistSelection.isSelected(child);
      });
    if (nodeSelected && !descAllSelected) {
      this.checklistSelection.deselect(node);
    } else if (!nodeSelected && descAllSelected) {
      this.checklistSelection.select(node);
    }
  }

  /* Get the parent node of a node */
  getParentNode(node: ItemFlatNode): ItemFlatNode | null {
    const currentLevel = this.getLevel(node);

    if (currentLevel < 1) {
      return null;
    }

    const startIndex = this.treeControl.dataNodes.indexOf(node) - 1;

    for (let i = startIndex; i >= 0; i--) {
      const currentNode = this.treeControl.dataNodes[i];

      if (this.getLevel(currentNode) < currentLevel) {
        return currentNode;
      }
    }
    return null;
  }


  buildTree(data: ItemNode[]) {
    let root = [];
    let map = new Map();
    for (let i = 0; i < data.length; i++) {
      map.set(data[i].id, i);
    }
    for (let i = 0; i < data.length; i++) {
      let node = data[i];
      if (node.parentId !== null) { // current node parent id is null
        data[map.get(node.parentId)].children.push(node);
      } else {
        root.push(node);
      }
    }

    return root;
  }

  selectedNode() {
    const childs = this.checklistSelection.selected.filter(select => select.parentId); // get only child elements
    console.log(childs);
  }

}

interface ItemNode {
  id: number;
  name: string;
  parentId: number | null;
  children: ItemNode[];
}

export class ItemFlatNode {
  id: number;
  parentId: number | null;
  name: string;
  level: number;
  expandable: boolean;
}

const DATA: ItemNode[] = [
  {
    name: "Test 1",
    id: 1,
    parentId: null,
    children: []
  },
  {
    name: "Test 2.1",
    id: 2,
    parentId: 1,
    children: []
  },
  {
    name: "Test 3.1",
    id: 3,
    parentId: 1,
    children: []
  },
  {
    name: "Test 4",
    id: 4,
    parentId: null,
    children: []
  },
  {
    name: "Test 5.4",
    id: 5,
    parentId: 4,
    children: []
  },
  {
    name: "Test 6.5",
    id: 6,
    parentId: 4,
    children: []
  },
  {
    name: "Test 7.4",
    id: 7,
    parentId: 4,
    children: []
  },
  {
    name: "Test 8",
    id: 8,
    parentId: null,
    children: []
  },
  {
    name: "Test 9.7",
    id: 9,
    parentId: 7,
    children: []
  },
  {
    name: "Test 10.7",
    id: 10,
    parentId: 7,
    children: []
  }
];
